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
import { calculate, DiscordRequest } from "./utils.js";
import {
  createDb,
  getDebtByUserId,
  getDebts,
  initDb,
  insert,
  update,
} from "./db/db.js";
import { SQLOutputValue } from "node:sqlite";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY!),
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
                content: `hello world`,
              },
            ],
          },
        });
      }

      if (name === "all_debts") {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `All debts:\n${getDebtsFormatted()}`,
              },
            ],
          },
        });
      }

      if (name === "debt") {
        const userId: string = data.options.find(
          (option: { name: string; value: string }) => option.name === "user"
        ).value;
        const math_operator: string = data.options.find(
          (option: { name: string; value: string }) =>
            option.name === "math_operator"
        ).value;
        const amount: number = data.options.find(
          (option: { name: string; value: string }) => option.name === "amount"
        ).value;

        const userDebt = getDebtByUserId.get(userId);
        if (!userDebt) {
          insert.run(calculate(0, math_operator, amount), userId);
        } else {
          update.run(
            calculate(<number>userDebt.debt, math_operator, amount),
            userId
          );
        }
        // const debts = await getLastDebts(process.env.CHANNEL_ID!, data);

        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: InteractionResponseFlags.IS_COMPONENTS_V2,
            components: [
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `${math_operator} ${amount} to <@${userId}>s debt`,
              },
              {
                type: MessageComponentTypes.TEXT_DISPLAY,
                content: `Debts:\n${getDebtsFormatted()}`,
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

function getDebtsFormatted() {
  let textDisplay = "";
  const debts: Record<string, SQLOutputValue>[] = getDebts.all();
  const mostDebt = Math.max(...debts.map((debt) => <number>debt["debt"]));
  for (const debt of debts) {
    textDisplay += `<@${debt["userId"]}>: ${debt["debt"]}${
      mostDebt === debt["debt"] ? " <:debtcollector:1436768848715059382>" : ""
    }\n`;
  }
  return textDisplay;
}

app.listen(PORT, () => {
  try {
    console.log("create db...");
    createDb();
  } catch (e) {
    console.log("db exists already.");
  }
  console.log("init db...");
  initDb();
  console.log("Listening on port", PORT);
});
