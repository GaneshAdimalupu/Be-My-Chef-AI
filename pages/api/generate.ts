import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure API_KEY is defined
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error("API_KEY is not defined in the environment variables.");
}

// Initialize the Google Generative AI instance with your API key
const genAI = new GoogleGenerativeAI(apiKey);

const post = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ingredients, cookTime } = req.body as {
    ingredients: string[];
    cookTime: number;
  };

  const prompt = `I have these ingredients: ${ingredients.join(", ")}. Suggest 3 different recipes I can cook in under ${cookTime} minutes. The response should be 3 paragraphs. Don't include ingredient lists etc. in the response, and no decorative text like "Here's a recipe for you" or "Another recipe you'd enjoy...".`;

  // Get the generative model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    // Generate content using the prompt
    const result = await model.generateContent(prompt);

    // Ensure result has the expected structure
    if (result && result.response && typeof result.response.text === 'function') {
      const responseText = result.response.text();

      const recipes = responseText.split("\n").filter((line: string) => line.length > 0);

      // Ensure we have at least three recipes to return
      if (recipes.length >= 3) {
        res.status(200).json({
          recipes: [recipes[0], recipes[1], recipes[2]],
        });
      } else {
        res.status(500).json({ error: 'Not enough recipes generated.' });
      }
    } else {
      res.status(500).json({ error: 'Unexpected response structure from Gemini API' });
    }
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "POST":
      await post(req, res);
      break;
    default:
      res.status(405).end(); // Method Not Allowed
  }
};



export default handler;



