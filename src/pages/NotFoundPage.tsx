import { ArrowRight } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { dashboardLink } from "@/config";
import { useSiteLanguage } from "@/hooks/useSiteLanguage";

const NotFoundPage = () => {
  const { t } = useTranslation();
  const { localPath } = useSiteLanguage();

  return (
    <section className="not-found-section" aria-labelledby="not-found-title">
      <div className="site-container not-found-layout">
        <p className="not-found-code" aria-hidden="true">
          404
        </p>
        <div className="not-found-copy">
          <h1 id="not-found-title">{t("notFound.title")}</h1>
          <p>{t("notFound.description")}</p>
          <div className="not-found-actions">
            <Link to={localPath("/")} className="button button-primary">
              {t("notFound.backHome")}
              <ArrowRight aria-hidden="true" />
            </Link>
            <a href={dashboardLink("/", "not-found")} className="button button-secondary">
              {t("notFound.openDashboard")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFoundPage;
