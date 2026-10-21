import { Link, useLocation } from "react-router-dom";
import { formatPostDate, relatedBlogPosts } from "@/content/blog";
import { blogPosts, docs, getContentForPath } from "@/content/documents";
import NotFoundPage from "@/pages/NotFoundPage";

const MarkdownPage = () => {
  const { pathname } = useLocation();
  const document = getContentForPath(pathname);
  if (!document) return <NotFoundPage />;
  const post = document.kind === "post" ? document : undefined;
  const related = post ? relatedBlogPosts(blogPosts, post) : [];
  const updated = document.updated;

  const article = (
    <article lang="en" className={post ? "site-container content-page" : "content-page docs-article"}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span aria-hidden="true">&gt;</span>
        <Link to={post ? "/blog/" : "/docs/"}>{post ? "Blog" : "Docs"}</Link><span aria-hidden="true">&gt;</span>
        <span aria-current="page">{document.shortTitle}</span>
      </nav>
      <p className="post-dates">
        {post && <>Published <time dateTime={post.date}>{formatPostDate(post.date)}</time><span aria-hidden="true"> / </span></>}
        Updated <time dateTime={updated}>{formatPostDate(updated)}</time>
      </p>
      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: document.html }} />
      {post && (
        <aside className="post-related" aria-labelledby="related-posts">
          <h2 id="related-posts">Related posts</h2>
          <ul>{related.map((item) => <li key={item.slug}><Link to={item.path}>{item.shortTitle}</Link></li>)}</ul>
          <p>See <Link to="/docs/how-it-works/">how PredixLab works</Link> for data sources and validation, and review the <Link to="/docs/limitations/">known limitations</Link>.</p>
        </aside>
      )}
      <div className="content-disclaimer markdown-content" dangerouslySetInnerHTML={{ __html: document.disclaimerHtml }} />
    </article>
  );
  if (post) return article;
  return (
    <div lang="en" className="site-container docs-layout">
      <nav className="docs-sidebar" aria-label="Docs">
        <Link to="/docs/" className="docs-sidebar-title">Docs</Link>
        <ul>{docs.map((doc) => (
          <li key={doc.path}><Link to={doc.path} aria-current={doc.path === document.path ? "page" : undefined}>{doc.shortTitle}</Link></li>
        ))}</ul>
      </nav>
      {article}
    </div>
  );
};

export default MarkdownPage;
