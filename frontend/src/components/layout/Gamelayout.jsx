import { Container } from "react-bootstrap";
import NavBar from "./NavBar.jsx";

<<<<<<< HEAD
// Wraps game pages with a navbar and container
export default function GameLayout({ children }) {
  return (
    <div className="game-layout">
      {/* Navbar shows on every page that uses this layout */}
      <NavBar />

      {/* Fluid container takes full width, children is whatever page content gets passed in */}
=======
export default function GameLayout({ children }) {
  return (
    <div className="game-layout">
      <NavBar />
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
      <Container fluid className="game-container">
        {children}
      </Container>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
