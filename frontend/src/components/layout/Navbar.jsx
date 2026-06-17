import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// Navigation bar component
export default function NavBar() {

  // Get authentication information and functions from context
  const { user, logout, isAuthenticated } = useAuth();

  // Used to redirect users to another page
  const navigate = useNavigate();

  // Log the user out and send them back to the home page
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="navbar-metro">
      <Container>
        {/* Website logo and title */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <span className="metro-logo me-2">M</span>
          <span>Last Race - Torino</span>
        </Navbar.Brand>

        {/* Button used to collapse the menu on smaller screens */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          {/* Main navigation links */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>

            {/* Only show the Play page if the user is logged in */}
            {isAuthenticated && (
              <Nav.Link as={Link} to="/game">
                Play
              </Nav.Link>
            )}

            <Nav.Link as={Link} to="/leaderboard">
              Leaderboard
            </Nav.Link>
          </Nav>

          {/* Authentication section on the right side */}
          <Nav>
            {isAuthenticated ? (
              <>
                {/* Display the logged in user username */}
                <Navbar.Text className="me-3">
                  Hello, <strong>{user.username}</strong>
                </Navbar.Text>

                {/* Logout button */}
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={handleLogout}
                >
                  Exit
                </Button>
              </>
            ) : (
              // Show login link if the user is not authenticated
              <Nav.Link as={Link} to="/login">
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
