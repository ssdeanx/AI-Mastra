// Generated on 2025-06-01
/**
 * Base Toolset - Swiss Army Knife Collection
 * 
 * Comprehensive collection of utility tools for mathematical operations,
 * text processing, data manipulation, validation, and general utilities.
 * 
 * @module baseToolset
 * @see {@link https://github.com/mastra-ai/mastra} - Mastra documentation
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { evaluate, format as mathFormat, simplify, derivative, lsolve, parse as mathParse, MathNode, FunctionNode } from "mathjs"; // Simplified mathjs imports
import { 
  formatISO, 
  parseISO, 
  isValid, 
  format as dfFormat, 
  differenceInYears,
  differenceInMonths,
  differenceInWeeks,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  differenceInMilliseconds,
  addYears,
  addMonths,
  addWeeks,
  addDays,
  addHours,
  addMinutes,
  addSeconds,
  addMilliseconds,
  getYear,
  getMonth,
  getDate,
  getHours,
  getMinutes,
  getSeconds,
  getTime
} from 'date-fns';

// Type guard for mathjs FunctionNode
function isFunctionNode(node: MathNode): node is FunctionNode {
  return node && typeof (node as any).isFunctionNode === 'boolean' && (node as any).isFunctionNode;
}

/**
 * Text transformation utilities
 */
export const textTransformer = createTool({
  id: "text_transformer",
  inputSchema: z.object({
    text: z.string().describe("Text to transform"),
    transformations: z.array(z.enum([
      "uppercase", "lowercase", "title_case", "sentence_case", "camel_case", 
      "snake_case", "kebab_case", "reverse", "remove_spaces", "remove_punctuation",
      "extract_emails", "extract_urls", "extract_numbers", "word_wrap"
    ])).describe("List of transformations to apply"),
    wordWrapLength: z.number().int().min(10).max(200).default(80).optional().describe("Line length for word wrapping")
  }),
  description: "Apply various text transformations including case changes, formatting, extraction, and cleanup operations.",
  execute: async ({ context }) => {
    try {
      let result = context.text;
      const appliedTransformations: string[] = [];
      
      for (const transformation of context.transformations) {
        switch (transformation) {
          case "uppercase":
            result = result.toUpperCase();
            appliedTransformations.push("Converted to uppercase");
            break;
            
          case "lowercase":
            result = result.toLowerCase();
            appliedTransformations.push("Converted to lowercase");
            break;
            
          case "title_case":
            result = result.replace(/\w\S*/g, (txt: string) => 
              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            appliedTransformations.push("Converted to title case");
            break;
            
          case "sentence_case":
            result = result.toLowerCase().replace(/(^\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
            appliedTransformations.push("Converted to sentence case");
            break;
            
          case "camel_case":
            result = result.replace(/(?:^\w|[A-Z]|\b\w)/g, (word: string, index: number) => 
              index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
            appliedTransformations.push("Converted to camelCase");
            break;
            
          case "snake_case":
            result = result.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
            appliedTransformations.push("Converted to snake_case");
            break;
            
          case "kebab_case":
            result = result.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            appliedTransformations.push("Converted to kebab-case");
            break;
            
          case "reverse":
            result = result.split('').reverse().join('');
            appliedTransformations.push("Reversed text");
            break;
            
          case "remove_spaces":
            result = result.replace(/\s/g, '');
            appliedTransformations.push("Removed all spaces");
            break;
            
          case "remove_punctuation":
            result = result.replace(/[^\w\s]/g, '');
            appliedTransformations.push("Removed punctuation");
            break;
            
          case "extract_emails":
            const emails = result.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
            result = emails.join(', ');
            appliedTransformations.push(`Extracted ${emails.length} email addresses`);
            break;
            
          case "extract_urls":
            const urls = result.match(/https?:\/\/[^\s]+/g) || [];
            result = urls.join(', ');
            appliedTransformations.push(`Extracted ${urls.length} URLs`);
            break;
            
          case "extract_numbers":
            const numbers = result.match(/\d+(?:\.\d+)?/g) || [];
            result = numbers.join(', ');
            appliedTransformations.push(`Extracted ${numbers.length} numbers`);
            break;
            
          case "word_wrap":
            const words = result.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            
            for (const word of words) {
              if ((currentLine + word).length <= (context.wordWrapLength ?? 80)) {
                currentLine += (currentLine ? ' ' : '') + word;
              } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
              }
            }
            if (currentLine) lines.push(currentLine);
            
            result = lines.join('\n');
            appliedTransformations.push(`Word wrapped to ${context.wordWrapLength ?? 80} characters per line`);
            break;
        }
      }
      
      return {
        success: true,
        originalText: context.text,
        transformedText: result,
        appliedTransformations,
        characterChange: result.length - context.text.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Text transformation failed",
        originalText: context.text
      };
    }
  }});

/**
 * Calculator Tool
 * 
 * Performs mathematical calculations using mathjs.
 * Supports a wide range of operations including arithmetic, functions,
 * matrices, and symbolic computation.
 * 
 * @see {@link https://mathjs.org/docs/expressions/syntax.html} - Math.js expression syntax
 */
export const calculator = createTool({
  id: "calculator",
  inputSchema: z.object({
    expression: z.string().describe("Mathematical expression to evaluate (e.g., '2 + 2', 'sqrt(16)', 'derivative(\\'x^2\\', \\'x\\')')"),
    precision: z.number().int().min(0).max(14).optional().default(14).describe("Number of decimal places for formatting the result")
  }),
  description: "Evaluates mathematical expressions. Supports arithmetic, functions, matrices, and symbolic computation.",
  execute: async ({ context }) => {
    // Generated on 2025-06-01
    try {
      const { expression, precision } = context;
      let result;
      let simplifiedExpression;
      let parsedMathExpression: MathNode | undefined;
      let evaluatedDerivative;

      try {
        parsedMathExpression = mathParse(expression);
        simplifiedExpression = simplify(parsedMathExpression).toString();
      } catch (e) {
        simplifiedExpression = expression;
        // Attempt to parse again if simplification failed, for derivative check
        try { parsedMathExpression = mathParse(expression); } catch {} 
      }
      
      if (expression.toLowerCase().startsWith("derivative(")) {
        try {
          const match = expression.match(/derivative\\s*\\(\\s*['"]([^'"]+)['"]\\s*,\\s*['"]([^'"]+)['"]\\s*\\)/i);
          if (match && match[1] && match[2]) {
            const func = match[1];
            const variable = match[2];
            evaluatedDerivative = derivative(func, variable).toString();
            result = evaluatedDerivative;
          } else if (parsedMathExpression && 
                     isFunctionNode(parsedMathExpression) && 
                     parsedMathExpression.fn.name === 'derivative' && 
                     parsedMathExpression.args.length === 2) {
            const funcNode = parsedMathExpression.args[0].toString();
            const varNode = parsedMathExpression.args[1].toString();
            evaluatedDerivative = derivative(funcNode, varNode).toString();
            result = evaluatedDerivative;
          } else {
            throw new Error("Invalid derivative expression format. Expected: derivative('function', 'variable') or a parsable mathjs derivative function node.");
          }
        } catch (error) {
           return {
            success: false,
            error: error instanceof Error ? `Derivative calculation error: ${error.message}` : "Derivative calculation failed",
            expression: expression,
          };
        }
      } else {
        result = evaluate(simplifiedExpression);
      }

      const formattedResult = typeof result === 'number' 
        ? mathFormat(result, { precision: precision }) 
        : (typeof result === 'object' && result !== null && typeof result.toString === 'function' ? result.toString() : String(result));

      return {
        success: true,
        expression: expression,
        simplifiedExpression: simplifiedExpression !== expression ? simplifiedExpression : undefined,
        result: formattedResult,
        resultType: typeof result,
        ...(evaluatedDerivative && { derivative: evaluatedDerivative }),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Calculation failed",
        expression: context.expression,
      };
    }
  }
});

/**
 * JSON Validator Tool
 * 
 * Validates if a given string is a valid JSON.
 * Can also attempt to parse and pretty-print the JSON if valid.
 */
export const jsonValidator = createTool({
  id: "json_validator",
  inputSchema: z.object({
    jsonString: z.string().describe("The string to validate as JSON."),
    prettyPrint: z.boolean().optional().default(false).describe("If true and JSON is valid, output a pretty-printed version.")
  }),
  description: "Validates a string to check if it is valid JSON. Can also pretty-print valid JSON.",
  execute: async ({ context }) => {
    // Generated on 2025-06-01
    try {
      const { jsonString, prettyPrint } = context;
      const parsedJson = JSON.parse(jsonString);
      let output = "JSON is valid.";
      let prettyJson;

      if (prettyPrint) {
        prettyJson = JSON.stringify(parsedJson, null, 2);
        output += " Pretty-printed version included."
      }

      return {
        success: true,
        isValid: true,
        message: output,
        ...(prettyPrint && { prettyJson: prettyJson }),
        originalString: jsonString,
      };
    } catch (error) {
      return {
        success: false,
        isValid: false,
        error: error instanceof Error ? `Invalid JSON: ${error.message}` : "JSON validation failed",
        originalString: context.jsonString,
      };
    }
  }
});

/**
 * Date Utility Tool
 * 
 * Provides various date and time functionalities, such as getting the current
 * date/time, formatting dates, and calculating date differences.
 */
export const dateUtility = createTool({
  id: "date_utility",
  inputSchema: z.object({
    action: z.enum([
      "current_datetime", 
      "format_date", 
      "date_difference",
      "add_duration",
      "parse_date"
    ]).describe("The date/time action to perform."),
    dateString: z.string().optional().describe("An ISO 8601 date string (e.g., '2023-10-26T10:00:00.000Z') for 'format_date', 'add_duration', or 'parse_date' actions. Defaults to current date if not provided for 'format_date' or 'add_duration' when applicable."),
    formatPattern: z.string().optional().default("yyyy-MM-dd'T'HH:mm:ss.SSSXXX").describe("The pattern to format the date (e.g., 'yyyy-MM-dd', 'eeee, MMMM do yyyy, h:mm:ss a'). Uses date-fns formatting. See: https://date-fns.org/v2.29.3/docs/format"),
    dateStringTwo: z.string().optional().describe("A second ISO 8601 date string for 'date_difference' action."),
    unit: z.enum([
        "years", "months", "weeks", "days", 
        "hours", "minutes", "seconds", "milliseconds"
    ]).optional().default("days").describe("Unit for date difference or duration."),
    duration: z.number().optional().describe("Duration to add for 'add_duration' action (positive or negative integer).")
  }),
  description: "Provides date and time utilities using date-fns, like getting current date/time, formatting, parsing, and calculating differences/durations.",
  execute: async ({ context }) => {
    // Generated on 2025-06-01. Refactored to use date-fns on 2025-06-01.
    try {
      const { action, dateString, formatPattern, dateStringTwo, unit, duration } = context;

      switch (action) {
        case "current_datetime":
          const now = new Date();
          return {
            success: true,
            action,
            currentDateTimeISO: formatISO(now),
            currentTimestamp: getTime(now),
            formattedDateTime: dfFormat(now, formatPattern || "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
          };

        case "format_date":
          const dateToFormatInput = dateString ? parseISO(dateString) : new Date();
          if (!isValid(dateToFormatInput)) {
            throw new Error(`Invalid dateString provided for formatting: ${dateString}`);
          }
          return { 
            success: true, 
            action, 
            originalDate: formatISO(dateToFormatInput), 
            formattedDate: dfFormat(dateToFormatInput, formatPattern || "yyyy-MM-dd'T'HH:mm:ss.SSSXXX") 
          };

        case "date_difference":
          if (!dateString || !dateStringTwo) {
            throw new Error("Both dateString and dateStringTwo are required for 'date_difference'.");
          }
          const dateOne = parseISO(dateString);
          const dateTwo = parseISO(dateStringTwo);
          if (!isValid(dateOne) || !isValid(dateTwo)) {
            throw new Error(`Invalid date string provided for difference. Date One: ${dateString}, Date Two: ${dateStringTwo}`);
          }
          
          let difference;
          const u = unit || "days";

          if (u === "years") difference = differenceInYears(dateOne, dateTwo);
          else if (u === "months") difference = differenceInMonths(dateOne, dateTwo);
          else if (u === "weeks") difference = differenceInWeeks(dateOne, dateTwo);
          else if (u === "days") difference = differenceInDays(dateOne, dateTwo);
          else if (u === "hours") difference = differenceInHours(dateOne, dateTwo);
          else if (u === "minutes") difference = differenceInMinutes(dateOne, dateTwo);
          else if (u === "seconds") difference = differenceInSeconds(dateOne, dateTwo);
          else if (u === "milliseconds") difference = differenceInMilliseconds(dateOne, dateTwo);
          else throw new Error(`Unsupported unit for difference: ${unit}`); // Should be caught by Zod
          
          return { 
            success: true, 
            action, 
            dateOne: formatISO(dateOne), 
            dateTwo: formatISO(dateTwo), 
            difference: Math.abs(difference), // Return absolute difference
            unit: u 
          };

        case "add_duration":
          if (typeof duration !== 'number') { // dateString can default to now
            throw new Error("'duration' (number) is required for 'add_duration'.");
          }
          const baseDateInput = dateString ? parseISO(dateString) : new Date();
          if (!isValid(baseDateInput)) {
            throw new Error(`Invalid dateString provided for adding duration: ${dateString}`);
          }
          
          let resultDate;
          const durUnit = unit || "days";
          const durAmount = Math.trunc(duration); // Ensure integer for duration

          if (durUnit === "years") resultDate = addYears(baseDateInput, durAmount);
          else if (durUnit === "months") resultDate = addMonths(baseDateInput, durAmount);
          else if (durUnit === "weeks") resultDate = addWeeks(baseDateInput, durAmount);
          else if (durUnit === "days") resultDate = addDays(baseDateInput, durAmount);
          else if (durUnit === "hours") resultDate = addHours(baseDateInput, durAmount);
          else if (durUnit === "minutes") resultDate = addMinutes(baseDateInput, durAmount);
          else if (durUnit === "seconds") resultDate = addSeconds(baseDateInput, durAmount);
          else if (durUnit === "milliseconds") resultDate = addMilliseconds(baseDateInput, durAmount);
          else throw new Error(`Unsupported unit for duration: ${unit}`); // Should be caught by Zod

          return { 
            success: true, 
            action, 
            originalDate: formatISO(baseDateInput), 
            duration: durAmount, 
            unit: durUnit, 
            newDate: formatISO(resultDate) 
          };
        
        case "parse_date":
          if (!dateString) {
            throw new Error("dateString is required for 'parse_date' action.");
          }
          const parsedDate = parseISO(dateString);
          if (!isValid(parsedDate)) {
            throw new Error(`Could not parse date string: ${dateString}. Ensure it is a valid ISO 8601 format.`);
          }
          return {
            success: true,
            action,
            originalString: dateString,
            isoDateTime: formatISO(parsedDate),
            timestamp: getTime(parsedDate),
            year: getYear(parsedDate),
            month: getMonth(parsedDate) + 1, // date-fns getMonth is 0-indexed
            day: getDate(parsedDate),
            hour: getHours(parsedDate),
            minute: getMinutes(parsedDate),
            second: getSeconds(parsedDate)
          };

        default:
          // This should not be reached due to Zod enum validation
          throw new Error(`Invalid date utility action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Date utility operation failed",
        action: context.action,
        inputContext: context // Provide full input context for debugging
      };
    }
  }
});