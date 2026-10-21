import { Link } from "react-router-dom";
import { blogContent, formatPostDate, groupBlogPosts } from "@/content/blog";
import { blogPosts } from "@/content/documents";
import { headingId } from "@/content/markdown";

const BlogPage = () => (
  <div lang="en">
    <section className="page-hero">
      <div className="site-container page-intro">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">&gt;</span>
          <span aria-current="page">Blog</span>
        </nav>
        <p className="eyebrow">PREDIXLAB / BLOG</p>
        <h1>Blog</h1>
        <p>{blogContent.description}</p>
        <p>Read <Link to="/docs/how-it-works/">how PredixLab builds and tests its signals</Link>, including <Link to="/docs/limitations/">known limitations</Link>.</p>
        <a className="text-link" href="/blog/rss.xml">Subscribe via RSS</a>
      </div>
    </section>
    <div className="site-container blog-index">
      {groupBlogPosts(blogPosts).map(({ category, posts }) => (
        <section className="blog-category" key={category} aria-labelledby={`category-${headingId(category)}`}>
          <h2 id={`category-${headingId(category)}`}>{category}</h2>
          <div className="blog-post-list">
            {posts.map((post) => (
              <article key={post.slug}>
                <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                <h3><Link to={post.path}>{post.title}</Link></h3>
                <p>{post.description}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  </div>
);

export default BlogPage;
