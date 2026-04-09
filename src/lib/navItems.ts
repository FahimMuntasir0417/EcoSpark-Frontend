import type { NavSection } from "@/types/dashboard.types";
import { getDefaultDashboardRoute, type UserRole } from "./authUtils";

export const getCommonNavItems = (role: UserRole): NavSection[] => {
  const defaultDashboard = getDefaultDashboardRoute(role);

  return [
    {
      items: [
        {
          title: "Home",
          href: "/",
          icon: "Home",
        },
        {
          title: "Dashboard",
          href: defaultDashboard,
          icon: "LayoutDashboard",
        },
        {
          title: "My Profile",
          href: "/my-profile",
          icon: "User",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Change Password",
          href: "/change-password",
          icon: "Settings",
        },
      ],
    },
  ];
};

export const scientistNavItems: NavSection[] = [
  {
    title: "Scientist Workspace",
    items: [
      {
        title: "My Ideas",
        href: "/scientist/dashboard/my-ideas",
        icon: "Lightbulb",
      },
      {
        title: "Create Idea",
        href: "/scientist/dashboard/create-idea",
        icon: "PlusCircle",
      },
      {
        title: "Draft Ideas",
        href: "/scientist/dashboard/draft-ideas",
        icon: "FileText",
      },
      {
        title: "Submitted Ideas",
        href: "/scientist/dashboard/submitted-ideas",
        icon: "Send",
      },
    ],
  },
];

export const adminNavItems: NavSection[] = [
  {
    title: "User Management",
    items: [
      {
        title: "Admins",
        href: "/admin/dashboard/admins-management",
        icon: "Shield",
      },
      {
        title: "Scientists",
        href: "/admin/dashboard/scientists-management",
        icon: "FlaskConical",
      },
      {
        title: "Members",
        href: "/admin/dashboard/members-management",
        icon: "Users",
      },
    ],
  },
  {
    title: "Idea Management",
    items: [
      {
        title: "All Ideas",
        href: "/admin/dashboard/ideas-management",
        icon: "Lightbulb",
      },
      {
        title: "Idea Tags",
        href: "/admin/dashboard/tag-management",
        icon: "ClipboardCheck",
      },
      {
        title: "Featured Ideas",
        href: "/admin/dashboard/featured-ideas",
        icon: "Star",
      },
      {
        title: "Archived Ideas",
        href: "/admin/dashboard/archived-ideas",
        icon: "Archive",
      },
      {
        title: "Idea Categories",
        href: "/admin/dashboard/create-idea-category",
        icon: "FolderPlus",
      },
      {
        title: "Specialties",
        href: "/admin/dashboard/specialty-management",
        icon: "Stethoscope",
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "All-Purchases",
        href: "/admin/dashboard/all-purchases",
        icon: " ChartBar",
      },
    ],
  },
];

export const memberNavItems: NavSection[] = [
  {
    title: "Explore",
    items: [
      {
        title: "Browse Ideas",
        href: "/dashboard/browse-ideas",
        icon: "Compass",
      },
      {
        title: "Saved Ideas",
        href: "/dashboard/saved-ideas",
        icon: "Bookmark",
      },
      {
        title: "Purchase Ideas",
        href: "/dashboard/purches-idea",
        icon: "ShoppingCart",
      },
    ],
  },
  {
    title: "My Activity",
    items: [
      {
        title: "My Votes",
        href: "/dashboard/my-votes",
        icon: "ThumbsUp",
      },
      {
        title: "My Comments",
        href: "/dashboard/my-comments",
        icon: "MessageSquare",
      },
    ],
  },
];

export const getNavItemsByRole = (role: UserRole): NavSection[] => {
  const commonNavItems = getCommonNavItems(role);

  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return [...commonNavItems, ...adminNavItems];

    case "SCIENTIST":
      return [...commonNavItems, ...scientistNavItems];

    case "MEMBER":
      return [...commonNavItems, ...memberNavItems];

    default:
      return commonNavItems;
  }
};
