import { useState } from "react";
import { Form, Button, Alert, Card, Spinner } from "react-bootstrap";
import { useAuth } from "./AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      navigate("/game");
    } catch (err) {
      setError(err.message || "Credential not valid!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="login-card">
      <Card.Header className="text-center">
        <h3 className="text-white">Access Last Race</h3>
        <p className="text-white mb-0">Enter to start playing</p>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Insert Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Insert Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Loading...
              </>
            ) : (
              "Access"
            )}
          </Button>
        </Form>

        <div className="mt-3 text-center text-white">
          <small>
            User test: mario, luigi, peach
            <br />
            Password: password123
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}
