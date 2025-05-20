import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { adminRoutes, userRoutes, guestRoutes } from "../routes";
import { LOGIN_ROUTE } from "../utils/consts";
import { Context } from "../index"; 
import { observer } from "mobx-react-lite";

const AppRouter: React.FC = observer(() => {
  const { user } = useContext(Context);
  const isAuth = user.isAuth;
  const userRole = localStorage.getItem("role");

  return (
    <Routes>
      {isAuth && userRole === "ADMIN" &&
        adminRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))
      }

      {isAuth && (userRole === "CLIENT" || userRole === "ADMIN") &&
        userRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))
      }

      {!isAuth &&
        guestRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))
      }

      <Route path="*" element={<Navigate to={LOGIN_ROUTE} />} />
    </Routes>
  );
});

export default AppRouter;
