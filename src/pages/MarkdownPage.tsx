import { Link, useLocation } from "react-router-dom";
import { formatPostDate, relatedBlogPosts } from "@/content/blog";
import { blogPosts, getContentForPath } from "@/content/documents";
import NotFoundPage from "@/pages/NotFoundPage";

const MarkdownPage = () => {
  const { pathname } = useLocation();
  const document = getContentForPath(pathname);
  if (!document) return <NotFoundPage />;
  const post = document.kind === "post" ? document : undefined;
  const related = post ? relatedBlogPosts(blogPosts, post) : [];
  const published = post ? post.date : document.frontmatter.datePublished;
  const updated = post ? post.updated : document.frontmatter.dateModified;

  return (
    <article lang="en" className="site-container content-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span aria-hidden="true">&gt;</span>
        {post && <><Link to="/blog/">Blog</Link><span aria-hidden="true">&gt;</span></>}
        <span aria-current="page">{document.shortTitle}</span>
      </nav>
      <p className="post-dates">
        Published <time dateTime={published}>{formatPostDate(published)}</time>
        <span aria-hidden="true"> / </span>
        Updated <time dateTime={updated}>{formatPostDate(updated)}</time>
      </p>
      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: document.html }} />
      {post && (
        <aside className="post-related" aria-labelledby="related-posts">
          <h2 id="related-posts">Related posts</h2>
          <ul>{related.map((item) => <li key={item.slug}><Link to={item.path}>{item.shortTitle}</Link></li>)}</ul>
          <p>See <Link to="/methodology/">PredixLab's methodology</Link> for data sources, validation, and known limitations.</p>
        </aside>
      )}
      <div className="content-disclaimer markdown-content" dangerouslySetInnerHTML={{ __html: document.disclaimerHtml }} />
    </article>
  );
};

export default MarkdownPage;
