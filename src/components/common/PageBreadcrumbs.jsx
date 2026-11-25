import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function PageBreadcrumbs() {
  const items = useSelector((state) => state.breadcrumbs.items);

  return (
    <nav className="page-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`}>
              {isCurrent ? (
                <span className="page-breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.path || "/dashboard"}>{item.label}</Link>
              )}
              {!isCurrent && (
                <ChevronRight size={14} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
