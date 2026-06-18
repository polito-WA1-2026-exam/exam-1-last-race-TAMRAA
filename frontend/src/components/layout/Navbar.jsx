import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

<<<<<<< HEAD
// Navigation bar
export default function NavBar() {
  // Get user stuff from auth context
  const { user, logout, isAuthenticated } = useAuth();

  // Send people to different pages
  const navigate = useNavigate();

  // When someone clicks logout redirect them to the home page
=======
// Navigation bar component
export default function NavBar() {

  // Get authentication information and functions from context
  const { user, logout, isAuthenticated } = useAuth();

  // Used to redirect users to another page
  const navigate = useNavigate();

  // Log the user out and send them back to the home page
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="navbar-metro">
      <Container>
<<<<<<< HEAD
        {/* Brand logo => clicking it goes to home page */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <span className="metro-logo me-2">M</span>
          <span>Torino Last Race</span>
        </Navbar.Brand>

        {/* Hamburger menu for mobile devices */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          {/* Main nav links on the left side */}
=======
        {/* Website logo and title */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <span className="metro-logo me-2">M</span>
          <span>Last Race - Torino</span>
        </Navbar.Brand>

        {/* Button used to collapse the menu on smaller screens */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          {/* Main navigation links */}
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>
<<<<<<< HEAD
            {/* Only show Play link if user is logged in */}
=======

            {/* Only show the Play page if the user is logged in */}
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
            {isAuthenticated && (
              <Nav.Link as={Link} to="/game">
                Play
              </Nav.Link>
            )}
<<<<<<< HEAD
=======

>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
            <Nav.Link as={Link} to="/leaderboard">
              Leaderboard
            </Nav.Link>
          </Nav>

<<<<<<< HEAD
          {/* Right side of navbar => shows login or user info */}
          <Nav>
            {isAuthenticated ? (
              <>
                {/* Show username when logged in */}
                <Navbar.Text className="me-3">
                  Hello, <strong>{user.username}</strong>
                </Navbar.Text>
=======
          {/* Authentication section on the right side */}
          <Nav>
            {isAuthenticated ? (
              <>
                {/* Display the logged in user username */}
                <Navbar.Text className="me-3">
                  Hello, <strong>{user.username}</strong>
                </Navbar.Text>

>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
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
<<<<<<< HEAD
              // Show login link if not logged in
=======
              // Show login link if the user is not authenticated
>>>>>>> df605aa820eb2c2a8e319e47c7f0054e1c750323
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
