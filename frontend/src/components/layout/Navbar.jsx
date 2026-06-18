import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// Navigation bar
export default function NavBar() {
  // Get user stuff from auth context
  const { user, logout, isAuthenticated } = useAuth();

  // Send people to different pages
  const navigate = useNavigate();

  // When someone clicks logout redirect them to the home page
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="navbar-metro">
      <Container>
        {/* Brand logo => clicking it goes to home page */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <span className="metro-logo me-2">M</span>
          <span>Torino Last Race</span>
        </Navbar.Brand>

        {/* Hamburger menu for mobile devices */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          {/* Main nav links on the left side */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
            {/* Only show Play link if user is logged in */}
            {isAuthenticated && (
              <Nav.Link as={Link} to="/game">
                Play
              </Nav.Link>
            )}
            <Nav.Link as={Link} to="/leaderboard">
              Leaderboard
            </Nav.Link>
          </Nav>

          {/* Right side of navbar => shows login or user info */}
          <Nav>
            {isAuthenticated ? (
              <>
                {/* Show username when logged in */}
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
              // Show login link if not logged in
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
