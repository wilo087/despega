import { it } from "node:test";
import assert from "node:assert/strict";
import {
  GetCommand,
  PutCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  createInitialState,
  startSession,
  ingenieriaIndustrial,
} from "@despega/simulator";
import { documentClient } from "./client.ts";
import { recordFromState } from "./progress.ts";
import { submitSceneResponse } from "./simulation-service.ts";
import type { DataConfig } from "./config.ts";
const config: DataConfig = {
  region: "us-east-1",
  tables: { core: "despega_dev_core", simulation: "despega_dev_simulation" },
};
it("persists factory state transactionally, replays one command once, and rejects stale versions", async (t) => {
  const now = "2026-11-11T12:00:00Z";
  const state = startSession(
    ingenieriaIndustrial,
    createInitialState(ingenieriaIndustrial, { playerName: "Alex", now }),
    { sessionIndex: 0, now },
  );
  let item: Record<string, unknown> = {
    ...recordFromState({
      studentId: "test-factory",
      runId: "test-run",
      attempt: 1,
      version: 1,
      state,
    }),
    pk: "STUDENT#test-factory",
    sk: "CAREER#ingenieria-industrial",
  };
  let writes = 0;
  t.mock.method(documentClient(config), "send", async (command: unknown) => {
    if (command instanceof GetCommand) return { Item: item };
    if (command instanceof TransactWriteCommand) {
      writes++;
      item = command.input.TransactItems![0]!.Put!.Item!;
      return {};
    }
    throw new Error("Unexpected AWS request: test never uses the network.");
  });
  const input = {
    studentId: "test-factory",
    careerId: "ingenieria-industrial",
    runId: "test-run",
    expectedVersion: 1,
    commandId: "command-1",
    sceneId: "1.0",
    response: {
      kind: "factory" as const,
      command: { op: "submit" as const, avatar: "alma" as const, name: "Alex" },
    },
    elapsedMs: 0,
    now,
  };
  const first = await submitSceneResponse(config, input);
  assert.equal(first.record.state.sceneIndex, 1);
  assert.equal(first.record.state.factory!.avatar, "alma");
  assert.equal(writes, 1);
  const replay = await submitSceneResponse(config, input);
  assert.equal(replay.record.version, 2);
  assert.equal(writes, 1);
  await assert.rejects(
    () => submitSceneResponse(config, { ...input, commandId: "different" }),
    /cambió/,
  );
  assert.equal(writes, 1);
});
it("saves and resumes tutorial progress without recording a decision or granting credit", async (t) => {
  const now = "2026-11-12T16:00:00Z";
  const state = startSession(
    ingenieriaIndustrial,
    createInitialState(ingenieriaIndustrial, { playerName: "Alex", now }),
    { sessionIndex: 0, now },
  );
  let item: Record<string, unknown> = {
    ...recordFromState({
      studentId: "test-tutorial",
      runId: "tutorial-run",
      attempt: 1,
      version: 1,
      state,
    }),
    pk: "STUDENT#test-tutorial",
    sk: "CAREER#ingenieria-industrial",
  };
  let writes = 0;
  t.mock.method(documentClient(config), "send", async (command: unknown) => {
    if (command instanceof GetCommand) return { Item: item };
    if (command instanceof PutCommand) {
      assert.match(command.input.ConditionExpression!, /version/);
      writes++;
      item = command.input.Item!;
      return {};
    }
    throw new Error("Unexpected request");
  });
  const input = {
    studentId: "test-tutorial",
    careerId: "ingenieria-industrial",
    runId: "tutorial-run",
    expectedVersion: 1,
    commandId: "tutorial-start",
    sceneId: "1.0",
    response: {
      kind: "factory" as const,
      command: { op: "tutorial" as const, action: "start" as const },
    },
    elapsedMs: 0,
    now,
  };
  const start = await submitSceneResponse(config, input);
  assert.equal(start.record.state.factory!.tutorial!.step, "welcome");
  assert.equal(start.record.state.factory!.paused, true);
  await submitSceneResponse(config, input);
  assert.equal(writes, 1);
  const next = await submitSceneResponse(config, {
    ...input,
    expectedVersion: 2,
    commandId: "tutorial-move",
    response: {
      kind: "factory",
      command: { op: "tutorial", action: "advance", expectedStep: "welcome" },
    },
  });
  assert.equal(next.record.state.factory!.tutorial!.step, "move");
  assert.equal(next.record.performance, state.performance);
  assert.deepEqual(next.record.state.factory!.objectives, []);
});
