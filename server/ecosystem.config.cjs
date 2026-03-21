module.exports = {
  apps: [
    {
      name: "ronin",
      script: "npm",
      args: "run dev",
      interpreter: "none"
    }
  ]
};

// pm2 start bun --name my-app -- run dev  is the actual cmd but 
// just run pm2 start ecosystem.config.cjs and it will work fine