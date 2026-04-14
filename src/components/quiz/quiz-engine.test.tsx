import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizEngine, DbQuizQuestion } from "./quiz-engine";
import { QuizQuestion } from "@/lib/core/ollama";

const mockQuestions: QuizQuestion[] = [
  {
    question: "Test question 1",
    options: ["Option A", "Option B", "Option C", "Option D"],
    answerIndex: 1, // Option B is correct
    explanation: "Because B is correct.",
  },
  {
    question: "Test question 2",
    options: ["Option E", "Option F", "Option G", "Option H"],
    answerIndex: 0, // Option E is correct
    explanation: "Because E is correct.",
  }
];

describe("QuizEngine", () => {
  it("allows selecting an option and checking the answer", async () => {
    const user = userEvent.setup();
    render(<QuizEngine questions={mockQuestions} />);

    // Click incorrect option
    const optionA = screen.getByRole("button", { name: "Option A" });
    await user.click(optionA);

    const checkButton = screen.getByRole("button", { name: /check answer/i });
    await user.click(checkButton);

    // Verify explanation and incorrect state and "Next Question" button
    expect(screen.getByText("Incorrect")).toBeInTheDocument();
    expect(screen.getByText("Because B is correct.")).toBeInTheDocument();
    
    // Proceed to next question
    const nextButton = screen.getByRole("button", { name: /next question/i });
    await user.click(nextButton);

    // See the second question
    expect(screen.getByText("Test question 2")).toBeInTheDocument();
  });

  it("handles the final question correctly", async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();

    render(<QuizEngine questions={mockQuestions} onComplete={mockOnComplete} />);

    // Skip to second question
    // We cannot skip without answering, so let's answer Q1
    let optionB = screen.getByRole("button", { name: "Option B" });
    await user.click(optionB);
    let checkButton = screen.getByRole("button", { name: /check answer/i });
    await user.click(checkButton);
    let nextButton = screen.getByRole("button", { name: /next question/i });
    await user.click(nextButton);

    // Answer Q2
    const optionE = screen.getByRole("button", { name: "Option E" });
    await user.click(optionE);
    checkButton = screen.getByRole("button", { name: /check answer/i });
    await user.click(checkButton);

    // Check complete flow
    const finishButton = screen.getByRole("button", { name: /finish quiz/i });
    await user.click(finishButton);

    // Called with score
    expect(mockOnComplete).toHaveBeenCalledWith(2, 2); // 2 correct out of 2
  });

  it("renders an inline dropdown when '___' is present in the question", async () => {
    const user = userEvent.setup();
    const blankQuestion: DbQuizQuestion[] = [{
      question: "わたし は ___ です。",
      options: ["学生", "先生", "会社員", "銀行員"],
      answerIndex: 0,
      explanation: "I am a student.",
      meaning: "I am a student.",
      unitId: 1
    }];

    render(<QuizEngine questions={blankQuestion} />);

    // Should find a combobox (select) instead of vertical buttons
    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toBeInTheDocument();

    // Select an option
    await user.selectOptions(dropdown, "学生 (学生)"); // formatOption results in "学生 (学生)" for non-rubied text

    const checkButton = screen.getByRole("button", { name: /check answer/i });
    await user.click(checkButton);

    expect(screen.getByText("Correct")).toBeInTheDocument();
  });
});
