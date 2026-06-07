import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";


export const listFiles = tool(
    async () => {
        console.log("==========================================")
        console.log("Using list files tool",)
        console.log("==========================================")


        const response = await axios.get('http://019ea2de-0884-72dc-b355-c93a7ae67201.agent.localhost/list-files');

        console.log("==========================================")
        console.log("response from list files tool", response.data)
        console.log("==========================================")

        return JSON.stringify(response.data.files);
    }, {
    name: 'list_files',
    description: 'List all files in the protected directory.This is helpful for understanding what files are available to read. No input is required for this tool.',
    schema: z.object({}).describe('No input is required for this tool.')

});

export const readFiles = tool(
    async ({ files: [] }) => {

        console.log("==========================================")
        console.log("Using read files tool with files", files)
        console.log("==========================================")

        const response = await axios.get("http://019ea2de-0884-72dc-b355-c93a7ae67201.agent.localhost/read-file?files=" + files.join(","));

        console.log("==========================================")
        console.log("response from read files tool", response.data)
        console.log("==========================================")

        return JSON.stringify(response.data.files);
    }, {
    name: 'read_files',
    description: 'Read the content of a specific file from the protected directory. This is useful for accessing the contents of files that have been listed using the listFiles tool. The input should be the name of the file you want to read.',
    schema: z.object({
        files: z.array(z.string()).describe('The names of the files to read, as returned by the listFiles tool.')
    })

});

export const updateFiles = tool(
    async ({ files }) => {

        console.log("==========================================")
        console.log("Using update files tool with files", files)
        console.log("==========================================")

        const response = await axios.patch("http://019ea2de-0884-72dc-b355-c93a7ae67201.agent.localhost/update-file", { updates: files });

        console.log("==========================================")
        console.log("response from update files tool", response.data)
        console.log("==========================================")

        return JSON.stringify(response.data.results);
    },
    {
        name: 'update_files',
        description: 'Update the content of a specific file in the protected directory. This is useful for modifying the contents of files that have been listed using the listFiles tool. This tool can be used to create new files or update existing files. The input should be an array of objects, where each object specifies the name of the file to update and the new content to write to that file.',
        schema: z.object({
            files: z.array(
                z.object({
                    file: z.string().describe('The name of the file to update, as returned by the listFiles tool.'),
                    content: z.string().describe('The new content to write to the file.')
                })
            ).describe('An array of file updates, where each update specifies the name of the file to update and the new content.')
        })
    }
)

