import OpenAI from "openai";
import type { APIRoute } from "astro";

const openai = new OpenAI({
  apiKey: import.meta.env.OPENAI_API_KEY,
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { description } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `
           Eres un narrador creativo que genera historias de miedo aptas para toda la familia basadas en la descripción de una imagen. Crea un título espeluznante seguido de una historia aterradora, llena de suspenso, que sea un cuento corto de 3 a 5 oraciones. Luego, proporciona un prompt en ingles de máximo 5 palabras, incluyendo niebla o sombras o telarañas o fantasmas, que permita generar un Background con IA que esté relacionado con la historia y sea aterrador; el prompt solo debe contener letras y no incluir signos de puntuación. No indiques cuál es el título, cuál es la historia o cuál es el fondo, y no utilices formato Markdown. Separa los campos con un guión (-).
          
          `,
        },
        {
          role: "user",
          content: `Genera un título, una historia espeluznante basada en esta descripción de imagen y un prompt, el cual sera utilizado para generar un Background con IA: "${description}"`,
        },
      ],
    });

    const responseContent = completion.choices[0]?.message?.content;

    const [title, story, prompt] = responseContent!
      .split("-")
      .map((part) => part.trim());

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(JSON.stringify({ title, story, prompt }))
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generando la historia:", error);
    return new Response(
      JSON.stringify({ error: "No se pudo generar la historia." }),
      {
        status: 500,
      }
    );
  }
};
