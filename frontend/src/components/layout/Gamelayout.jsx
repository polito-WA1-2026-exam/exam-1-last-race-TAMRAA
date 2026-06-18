import { Container } from "react-bootstrap";
import NavBar from "./NavBar.jsx";

// Wraps game pages with a navbar and container
export default function GameLayout({ children }) {
  return (
    <div className="game-layout">
      {/* Navbar shows on every page that uses this layout */}
      <NavBar />

      {/* Fluid container takes full width, children is whatever page content gets passed in */}
      <Container fluid className="game-container">
        {children}
      </Container>
    </div>
  );
}