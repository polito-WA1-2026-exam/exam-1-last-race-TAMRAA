import { Container, Row, Col } from "react-bootstrap";
import LoginForm from "../components/auth/LoginForm.jsx";
import NavBar from "../components/layout/NavBar.jsx";
import { useAuth } from "../components/auth/AuthContext.jsx";
import { Navigate } from "react-router-dom";

export default function LoginPage() {

  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/game" replaced/>;
  }

  return (
    <div className="login-page">
      <NavBar />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <LoginForm />
          </Col>
        </Row>
      </Container>
    </div>
  );
}
