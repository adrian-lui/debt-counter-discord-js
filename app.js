import "dotenv/config";
import express from "express";
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from "discord-interactions";
import { getRandomEmoji, DiscordRequest, getChannelMessages } from "./utils.js";
import { getShuffledOptions, getResult } from "./game.js";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {
    // Interaction id, type and data
    const { id, type, data } = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    /**
     * Handle slash command requests
     * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name } = data;

      // "test" command
      if (name === "test") {
        // Send a message into the channel where command was triggered from
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                // Fetches a random emoji to send from a helper function
                content: `hello world ${getRandomEmoji()}`,
              },
            ],
          },
        });
      }

      if (name === "debt") {
        const debts = {};
        const lastDebts = await getLastDebts(process.env.CHANNEL_ID);
        if (lastDebts) {
          lastDebts.forEach((lastDebt) => {
            const [id, debt] = lastDebt.split(":");
            debts[id.slice(2, -1)] = debt.trim();
          });
        }

        const user = data.options.find(
          (option) => option.name === "user"
        ).value;
        const math_operator = data.options.find(
          (option) => option.name === "math_operator"
        ).value;
        const amount = data.options.find(
          (option) => option.name === "amount"
        ).value;
        if (!debts[user]) {
          debts[user] = calculate(0, math_operator, amount);
        } else {
          debts[user] = calculate(debts[user], math_operator, amount);
        }
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `Debts:\n${showDebts(debts)}`,
              },
            ],
          },
        });
      }
      console.error(`unknown command: ${name}`);
      return res.status(400).json({ error: "unknown command" });
    }

    console.error("unknown interaction type", type);
    return res.status(400).json({ error: "unknown interaction type" });
  }
);

function showDebts(debts) {
  let textDisplay = "";
  for (const debt of Object.entries(debts)) {
    textDisplay += `<@${debt[0]}>: ${debt[1]}\n`;
  }
  return textDisplay;
}

function calculate(num1, operator, num2) {
  switch (operator) {
    case "add":
      return parseInt(num1) + parseInt(num2);
    case "minus":
      return parseInt(num1) - parseInt(num2);
    case "times":
      return parseInt(num1) * parseInt(num2);
    case "divide":
      return parseInt(num1) / parseInt(num2);
    case "power":
      return parseInt(num1) ** parseInt(num2);
  }
}

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
