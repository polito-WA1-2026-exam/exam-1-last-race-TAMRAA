import { Container } from "react-bootstrap";
import NavBar from "./NavBar.jsx";

export default function GameLayout({ children }) {
  return (
    <div className="game-layout">
      <NavBar />
      <Container fluid className="game-container">
        {children}
      </Container>
    </div>
  );
}
