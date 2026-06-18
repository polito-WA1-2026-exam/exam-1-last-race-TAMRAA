import { BrowserRouter, Routes, Route} from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthContext.jsx";
import NavBar from "./components/layout/Navbar.jsx";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<NavBar />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
