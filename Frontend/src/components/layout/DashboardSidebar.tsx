// src/components/layouts/DashboardSidebar.tsx
import { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  DesignServices as DesignIcon,
  Groups as TeamIcon,
  Assessment as ReportIcon,
  Devices as EquipmentIcon,
  Notifications as NotificationIcon,
  Settings as ConfigIcon,
  Code as VersionIcon,
  Security as RoleIcon,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Assessment,
} from "@mui/icons-material";

const drawerWidth = 240;

const DashboardSidebar = () => {
  const [open, setOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    designs: false,
    teams: false,
    reports: false,
    equipment: false,
    notifications: false,
    configurations: false,
    versions: false,
    roles: false,
  });

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const toggleMenu = (menu: string) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      name: "Designs",
      icon: <DesignIcon />,
      subItems: [
        { name: "Create Design", path: "/designs/create" },
        { name: "Optimize Design", path: "/designs/optimize" },
        { name: "Show Designs", path: "/designs" },
        { name: "Visualize Design", path: "/designs/visualize" },
      ],
    },
    {
      name: "Teams",
      icon: <TeamIcon />,
      subItems: [
        { name: "Show Teams", path: "/teams" },
        { name: "Create Team", path: "/teams/create" },
        { name: "Invite Individual", path: "/teams/invite" },
        { name: "Show Individuals", path: "/teams/individuals" },
      ],
    },
    {
      name: "Reports",
      icon: <ReportIcon />,
      subItems: [
        { name: "Show Reports", path: "/reports" },
        { name: "Generate Report", path: "/reports/generate" },
      ],
    },
    {
      name: "Equipment",
      icon: <EquipmentIcon />,
      subItems: [
        { name: "Show My Devices", path: "/devices" },
        { name: "Create Custom Device", path: "/devices/create" },
        { name: "Propose To Me", path: "/devices/propose" },
      ],
    },
    {
      name: "Notifications",
      icon: <NotificationIcon />,
      subItems: [
        { name: "Send Notification", path: "/notifications/send" },
        { name: "Sent Notifications", path: "/notifications" },
      ],
    },
    {
      name: "Configurations",
      icon: <ConfigIcon />,
      subItems: [
        { name: "Show Configs", path: "/configs" },
        { name: "Create Configuration", path: "/configs/create" },
      ],
    },
    {
      name: "Versions",
      icon: <VersionIcon />,
      subItems: [
        { name: "Show Versions", path: "/versions" },
        { name: "Create A Version", path: "/versions/create" },
      ],
    },
    {
      name: "Roles",
      icon: <RoleIcon />,
      subItems: [
        { name: "Show Roles", path: "/roles" },
        { name: "Create A Role", path: "/roles/create" },
        { name: "Assign Roles", path: "/roles/assign" },
      ],
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : 56,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? drawerWidth : 56,
          boxSizing: "border-box",
          transition: "width 0.3s ease",
        },
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "flex-end" }}>
        <IconButton onClick={toggleDrawer}>
          {open ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <div key={item.name}>
            <ListItem disablePadding>
              <ListItemButton
                onClick={
                  item.subItems
                    ? () =>
                        toggleMenu(item.name.toLowerCase().replace(" ", "_"))
                    : () => {}
                }
              >
                <ListItemIcon sx={{ minWidth: open ? 40 : "auto" }}>
                  {item.icon}
                </ListItemIcon>
                {open && <ListItemText primary={item.name} />}
                {open &&
                  item.subItems &&
                  (openMenus[item.name.toLowerCase().replace(" ", "_")] ? (
                    <ExpandLess />
                  ) : (
                    <ExpandMore />
                  ))}
              </ListItemButton>
            </ListItem>
            {item.subItems && (
              <Collapse
                in={
                  open && openMenus[item.name.toLowerCase().replace(" ", "_")]
                }
                timeout="auto"
                unmountOnExit
              >
                <List component="div" disablePadding>
                  {item.subItems.map((subItem) => (
                    <ListItemButton
                      key={subItem.name}
                      sx={{ pl: open ? 4 : 2 }}
                      onClick={() => {
                        /* Handle navigation */
                      }}
                    >
                      {open && <ListItemText primary={subItem.name} />}
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </div>
        ))}
      </List>
    </Drawer>
  );
};

export default DashboardSidebar;
