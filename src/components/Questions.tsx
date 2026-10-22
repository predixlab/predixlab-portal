import { Plus } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { Question } from "@/content/site";

const Questions = ({ items, renderAnswer }: {
  items: Question[];
  renderAnswer?: (item: Question) => ReactNode;
}) => (
  <div className="question-list">
    {items.map(({ question, answer }) => (
      <details className="question" key={question}>
        <summary><span>{question}</span><Plus aria-hidden="true" /></summary>
        <p>{renderAnswer ? renderAnswer({ question, answer }) : answer}</p>
      </details>
    ))}
  </div>
);

export default Questions;
