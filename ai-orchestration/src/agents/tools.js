import axios from "axios";
import { tool } from "langchain";
import * as z from "zod";


export const listFiles = tool(
    async ({ }, config) => {

        const writer = config.context?.writer ?? (() => { });

        writer("Listing files in project directory...\n")

        const response = await axios.get(`http://sandbox-service-${config.context.projectId}:3000/list-files`);

        writer("Files listed successfully." + "Files:" + response.data.files.join(",") + "\n")

        return JSON.stringify(response.data.files);
    }, {
    name: 'list_files',
    description: 'List all files in the protected directory.This is helpful for understanding what files are available to read. No input is required for this tool.',
    schema: z.object({}).describe('No input is required for this tool.')

});

export const readFiles = tool(
    async ({ files = [] }, config) => {

        const writer = config.writer;
        writer("Reading files..." + files.join(",") + "\n")

        const response = await axios.get(`http://sandbox-service-${config.context.projectId}:3000/read-file?files=` + files.join(","));

        writer("Files read successfully.\n")
        return JSON.stringify(response.data.files);
    }, {
    name: 'read_files',
    description: 'Read the content of a specific file from the protected directory. This is useful for accessing the contents of files that have been listed using the listFiles tool. The input should be the name of the file you want to read.',
    schema: z.object({
        files: z.array(z.string()).describe('The names of the files to read, as returned by the listFiles tool.')
    })

});

export const updateFiles = tool(
    async ({ files = [] }, config) => {

        const writer = config.context?.writer ?? (() => {});
        
        writer("Updating files..." + files.map(f => f.file).join(",") + "\n")

        const response = await axios.patch(`http://sandbox-service-${config.context.projectId}:3000/update-file`, { updates: files });

        writer("Files updated successfully.\n")

        return JSON.stringify(response.data.results);
    },
    {
        name: 'update_files',
        description: 'Create or update files in the project..',
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

