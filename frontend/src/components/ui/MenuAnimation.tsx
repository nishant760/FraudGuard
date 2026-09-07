import { ArrowRight } from "lucide-react";
import type React from "react";
import { NavLink } from "react-router-dom";
import "./MenuAnimation.css";

export interface MenuItemObject {
  label: string;
  path?: string;
  end?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export type MenuItemType = string | MenuItemObject;

export interface MenuAnimationProps {
  menuItems: MenuItemType[];
  className?: string;
}

export default function MenuAnimation({ menuItems, className = "" }: MenuAnimationProps) {
  return (
    <div className={`menu-animation-container ${className}`}>
      {menuItems.map((item, index) => {
        const isObject = typeof item !== "string";
        const label = isObject ? item.label : item;
        const path = isObject ? item.path : undefined;
        const end = isObject ? item.end : false;
        const onClick = isObject ? item.onClick : undefined;

        if (path) {
          return (
            <NavLink
              key={index}
              to={path}
              end={end}
              onClick={onClick}
              className={({ isActive }) =>
                `menu-animation-item group/menu ${isActive ? "active" : ""}`
              }
            >
              <ArrowRight className="menu-animation-arrow" />
              <span className="menu-animation-text">
                {label}
              </span>
            </NavLink>
          );
        }

        return (
          <div
            key={index}
            onClick={onClick}
            className="menu-animation-item group/menu"
          >
            <ArrowRight className="menu-animation-arrow" />
            <span className="menu-animation-text">
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
