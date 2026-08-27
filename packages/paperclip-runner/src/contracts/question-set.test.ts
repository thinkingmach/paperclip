import { describe, expect, it } from "vitest";

import {
  THINKINGMACH_QUESTION_RESPONSE_SCHEMA,
  THINKINGMACH_QUESTION_SET_SCHEMA,
  parseThinkingMachQuestionResponse,
  parseThinkingMachQuestionSet,
  type ThinkingMachQuestionSet,
} from "./question-set.js";

const questionSet: ThinkingMachQuestionSet = {
  schema: THINKINGMACH_QUESTION_SET_SCHEMA,
  title: "Release input",
  questions: [
    {
      id: "environment",
      prompt: "Where should we deploy?",
      required: true,
      answerMode: "single_select",
      options: [
        { id: "staging", label: "Staging", recommended: true },
        { id: "production", label: "Production" },
      ],
      customAnswer: { enabled: true, label: "Other" },
    },
    {
      id: "replicas",
      prompt: "How many replicas?",
      required: true,
      answerMode: "text",
      textValidation: { inputType: "integer", minimum: 1, maximum: 20 },
    },
  ],
};

describe("ThinkingMach question-set contract", () => {
  it("round-trips the portable presentation model", () => {
    expect(parseThinkingMachQuestionSet(questionSet)).toEqual(questionSet);
    expect(parseThinkingMachQuestionResponse(questionSet, {
      schema: THINKINGMACH_QUESTION_RESPONSE_SCHEMA,
      answers: {
        environment: { selectedOptionIds: ["staging"] },
        replicas: { text: "3" },
      },
    })).toEqual({
      schema: THINKINGMACH_QUESTION_RESPONSE_SCHEMA,
      answers: {
        environment: { selectedOptionIds: ["staging"] },
        replicas: { text: "3" },
      },
    });
  });

  it("rejects missing, unknown, and provider-shaped answers", () => {
    expect(() => parseThinkingMachQuestionResponse(questionSet, {
      schema: THINKINGMACH_QUESTION_RESPONSE_SCHEMA,
      answers: { environment: { selectedOptionIds: ["unknown"] }, replicas: { text: "3" } },
    })).toThrow(/unknown option/);
    expect(() => parseThinkingMachQuestionResponse(questionSet, {
      schema: THINKINGMACH_QUESTION_RESPONSE_SCHEMA,
      answers: { environment: { selectedOptionIds: ["staging"] } },
    })).toThrow(/replicas.*required/);
    expect(() => parseThinkingMachQuestionResponse(questionSet, {
      answers: { environment: { answers: ["Staging"] } },
    })).toThrow(/paperclip.question_response.v1/);
    expect(() => parseThinkingMachQuestionResponse(questionSet, {
      schema: THINKINGMACH_QUESTION_RESPONSE_SCHEMA,
      answers: {
        environment: { answers: ["Staging"] },
        replicas: { text: "3" },
      },
    })).toThrow(/canonical response contract/);
  });

  it("applies typed numeric validation before an adapter sees the answer", () => {
    expect(() => parseThinkingMachQuestionResponse(questionSet, {
      schema: THINKINGMACH_QUESTION_RESPONSE_SCHEMA,
      answers: {
        environment: { customText: "Canary" },
        replicas: { text: "3.5" },
      },
    })).toThrow(/valid integer/);
    expect(() => parseThinkingMachQuestionResponse(questionSet, {
      schema: THINKINGMACH_QUESTION_RESPONSE_SCHEMA,
      answers: {
        environment: { customText: "Canary" },
        replicas: { text: "21" },
      },
    })).toThrow(/at most 20/);
  });
});
