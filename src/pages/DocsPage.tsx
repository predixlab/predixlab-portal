import { Link } from "react-router-dom";
import ContentDisclaimer from "@/components/ContentDisclaimer";
import { docs, docsIndex } from "@/content/documents";

const DocsPage = () => (
  <div lang="en" className="site-container content-page">
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link><span aria-hidden="true">&gt;</span>
      <span aria-current="page">Docs</span>
    </nav>
    <div className="markdown-content" dangerouslySetInnerHTML={{ __html: docsIndex.html }} />
    <div className="docs-cards">
      {docs.map((doc) => (
        <article key={doc.path}>
          <h2><Link to={doc.path}>{doc.shortTitle}</Link></h2>
          <p>{doc.summary}</p>
        </article>
      ))}
    </div>
    <ContentDisclaimer />
  </div>
);

export default DocsPage;
