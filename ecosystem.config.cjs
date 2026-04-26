module.exports = {
    apps: [
        {
            name: "chat-backend",
            script: "dist/server.js",
            instances: "max",
            exec_mode: "cluster",
            interpreter: "bun",
            env: {
                PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`, // Add "~/.bun/bin/bun" to PATH
            },
        },
    ],
};
