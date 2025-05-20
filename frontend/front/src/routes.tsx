import AdminPanel from "./pages/AdminPanel";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Leader from "./pages/Leader";
import Quizzes from "./pages/Quizzes";
import QuizCatalog from "./pages/QuizCatalog";
import QuizCreate from "./pages/QuizCreate";
import QuizEdit from "./pages/QuizEdit";
import Results from "./pages/Results";
import User from "./pages/User";
import QuizPlayer from "./pages/QuizPlayer";

import {
  ADMINPANEL_ROUTE,
  HOME_ROUTE,
  LEADER_ROUTE,
  QUIZCREATE_ROUTE,
  QUIZEDIT_ROUTE,
  QUIZCATALOG_ROUTE,
  QUIZZES_ROUTE,
  QUIZEPLAYER_ROUTE,
  RESULTS_ROUTE,
  USER_ROUTE,
  LOGIN_ROUTE,
  REGISTRATION_ROUTE,
} from "./utils/consts";

interface Route {
  path: string;
  Component: React.ComponentType;
}

export const adminRoutes: Route[] = [
  { path: ADMINPANEL_ROUTE, Component: AdminPanel },
  { path: QUIZCREATE_ROUTE, Component: QuizCreate }, 
  { path: QUIZEDIT_ROUTE + "/:quiz_id", Component: QuizEdit }, 
  { path: HOME_ROUTE, Component: Home },
  { path: QUIZCATALOG_ROUTE, Component: QuizCatalog },
  { path: QUIZZES_ROUTE , Component: Quizzes },
  { path: QUIZEPLAYER_ROUTE + "/:quiz_id?", Component: QuizPlayer },
  { path: RESULTS_ROUTE + "/:quiz_id?", Component: Results },
  { path: LEADER_ROUTE + "/:quiz_id", Component: Leader },
  { path: USER_ROUTE , Component: User },
];

export const userRoutes: Route[] = [
  { path: HOME_ROUTE, Component: Home },
  { path: QUIZZES_ROUTE, Component: Quizzes }, 
  { path: QUIZEPLAYER_ROUTE + "/:quiz_id?" , Component: QuizPlayer },
  { path: RESULTS_ROUTE + "/:quiz_id?", Component: Results },
  { path: LEADER_ROUTE + "/:quiz_id", Component: Leader },
  { path: USER_ROUTE , Component: User },
  { path: QUIZCATALOG_ROUTE, Component: QuizCatalog },
  { path: QUIZCREATE_ROUTE, Component: QuizCreate }, 
  { path: QUIZEDIT_ROUTE + "/:quiz_id", Component: QuizEdit }, 
];

export const guestRoutes: Route[] = [
  { path: LOGIN_ROUTE, Component: Auth },
  { path: REGISTRATION_ROUTE, Component: Auth },
  { path: HOME_ROUTE, Component: Home },
  { path: QUIZCATALOG_ROUTE, Component: QuizCatalog },
  { path: QUIZCATALOG_ROUTE + "/:category_id", Component: QuizCatalog },
  { path: QUIZZES_ROUTE, Component: Quizzes },
];
