import "dotenv/config";
import { getRPSChoices } from "./game.js";
import { capitalize, InstallGlobalCommands } from "./utils.js";

// Simple test command
const TEST_COMMAND = {
  name: "test",
  description: "Basic command",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const DEBT_COMMAND = {
  name: "debt",
  description: "Update users debt",
  options: [
    { type: 6, name: "user", description: "user to add debt", required: true },
    {
      type: 3,
      name: "math_operator",
      description: "math operator to the amount",
      required: true,
      choices: [
        {
          name: "Add",
          value: "add",
        },
        {
          name: "Minus",
          value: "minus",
        },
        {
          name: "Times",
          value: "times",
        },
        {
          name: "Divide",
          value: "divide",
        },
        {
          name: "Power",
          value: "power",
        },
      ],
    },
    {
      type: 4,
      name: "amount",
      description: "the amount to operate",
      required: true,
    },
  ],
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const ALL_COMMANDS = [TEST_COMMAND, DEBT_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
