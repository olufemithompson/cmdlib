import open from "open";
import http from "http";
import chalkAnimation from "chalk-animation";
import chalk from "chalk";

const PORT = 5533;

export async function login() {
  const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith("/auth-callback")) {
      const url = new URL(`http://localhost:${PORT}${req.url}`);
      const token = url.searchParams.get("token");

      if (token) {
        console.log(
          chalk.magenta("→"),
          chalk.green(`Logged in! Token: ${token}`)
        );
      } else {
        console.log(chalk.magenta("→"), chalk.red("Login failed"));
      }

      res.end("Login successful. You can close this tab.");
      server.close();
    }
  });

  server.listen(PORT, async () => {
    const loginUrl = `http://localhost:3000/auth/cli-login?redirect=http://localhost:${PORT}/auth-callback`;

    const animation = chalkAnimation.rainbow("cmdlib");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    animation.stop();

    console.log(
      chalk.magenta("→"),
      chalk.green("Opening browser for login...")
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    open(loginUrl);
  });
}
