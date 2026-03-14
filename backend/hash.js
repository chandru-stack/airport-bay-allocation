import bcrypt from "bcrypt";

async function generateHash() {
  try {
    const password = "123456";
    const saltRounds = 10;

    const hash = await bcrypt.hash(password, saltRounds);
    console.log("\nGenerated Hash:\n", hash);
  } catch (err) {
    console.error("Error generating hash:", err);
  }
}

generateHash();