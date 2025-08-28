import express from "express";
import { generate } from "./app.js";
import cors from "cors"
const app = express();
const PORT = 3000;

app.use(cors());

app.use(express.json())
function generateThreadId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 9)
  );
}

app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

app.post("/chat",async(req ,res)=>{
   let {message , threadId} = req.body;

   if (!threadId) {
     threadId = generateThreadId();
    }
    const result = await generate(message,threadId);

   res.send({message: result,threadId});
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});