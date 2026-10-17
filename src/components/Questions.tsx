import { Plus } from "@phosphor-icons/react";
import type { Question } from "@/content/site";

const Questions = ({ items }: { items: Question[] }) => (
  <div className="question-list">
    {items.map(({ question, answer }) => (
      <details className="question" key={question}>
        <summary><span>{question}</span><Plus aria-hidden="true" /></summary>
        <p>{answer}</p>
      </details>
    ))}
  </div>
);

export default Questions;
