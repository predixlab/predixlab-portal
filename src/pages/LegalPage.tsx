import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getLegalDocument } from "@/content/legalDocuments";

interface LegalPageProps {
  type: "terms" | "privacy";
}

const LegalPage = ({ type }: LegalPageProps) => {
  const { i18n } = useTranslation();
  const document = useMemo(
    () => getLegalDocument(i18n.language, type),
    [i18n.language, type],
  );

  return (
    <>
      <section className="page-hero">
        <div className="site-container page-intro">
          <h1>{document.title}</h1>
          <p>{document.summary}</p>
          <p className="legal-updated">{document.effectiveDate}</p>
        </div>
      </section>

      <section className="legal-section">
        <article className="site-container legal-content">
          {document.sections.map((section) => (
            <section className="legal-block" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items?.length ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </article>
      </section>
    </>
  );
};

export default LegalPage;
