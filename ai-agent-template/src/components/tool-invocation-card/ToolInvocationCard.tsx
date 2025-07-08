import { useState } from "react";
import { Robot, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Tooltip } from "@/components/tooltip/Tooltip";
import { APPROVAL } from "@/shared";

interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: "call" | "result" | "partial-call";
  step?: number;
  args: Record<string, unknown>;
  result?: {
    content?: Array<{ type: string; text: string }>;
  };
}

interface ToolInvocationCardProps {
  toolInvocation: ToolInvocation;
  toolCallId: string;
  needsConfirmation: boolean;
  addToolResult: (args: { toolCallId: string; result: string }) => void;
}

// Type guard for meme result items
function isTextItem(item: any): item is { type: string; text: string } {
  return (
    item &&
    typeof item === "object" &&
    item.type === "text" &&
    typeof item.text === "string"
  );
}

export function ToolInvocationCard({
  toolInvocation,
  toolCallId,
  needsConfirmation,
  addToolResult,
}: ToolInvocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card
      className={`p-4 my-3 w-full max-w-[500px] rounded-md bg-neutral-100 dark:bg-neutral-900 ${
        needsConfirmation ? "" : "border-[#F48120]/30"
      } overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 cursor-pointer"
      >
        <div
          className={`${needsConfirmation ? "bg-[#F48120]/10" : "bg-[#F48120]/5"} p-1.5 rounded-full flex-shrink-0`}
        >
          <Robot size={16} className="text-[#F48120]" />
        </div>
        <h4 className="font-medium flex items-center gap-2 flex-1 text-left">
          {toolInvocation.toolName}
          {!needsConfirmation && toolInvocation.state === "result" && (
            <span className="text-xs text-[#F48120]/70">✓ Completed</span>
          )}
        </h4>
        <CaretDown
          size={16}
          className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`transition-all duration-200 ${isExpanded ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isExpanded ? "180px" : "0px" }}
        >
          <div className="mb-3">
            <h5 className="text-xs font-medium mb-1 text-muted-foreground">
              Arguments:
            </h5>
            <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
              {JSON.stringify(toolInvocation.args, null, 2)}
            </pre>
          </div>

          {needsConfirmation && toolInvocation.state === "call" && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  addToolResult({
                    toolCallId,
                    result: APPROVAL.NO,
                  })
                }
              >
                Reject
              </Button>
              <Tooltip content={"Accept action"}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    addToolResult({
                      toolCallId,
                      result: APPROVAL.YES,
                    })
                  }
                >
                  Approve
                </Button>
              </Tooltip>
            </div>
          )}

          {!needsConfirmation && toolInvocation.state === "result" && (
            <div className="mt-3 border-t border-[#F48120]/10 pt-3">
              <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                Result:
              </h5>
              {(() => {
                const result = toolInvocation.result;
                let url: string | null = null;
                // Try to extract the URL if the result is a memegen.link image
                if (
                  typeof result === "string" &&
                  result.startsWith("https://api.memegen.link/images/")
                ) {
                  url = result;
                } else if (
                  typeof result === "object" &&
                  result !== null &&
                  "content" in result &&
                  Array.isArray(result.content)
                ) {
                  // Sometimes the result is wrapped in a content array
                  const textItem = Array.isArray(result.content)
                    ? (result.content as Array<unknown>).find(
                        (item: unknown) => {
                          if (isTextItem(item)) {
                            return (item.text as string).startsWith(
                              "https://api.memegen.link/images/"
                            );
                          }
                          return false;
                        }
                      )
                    : undefined;
                  if (textItem && isTextItem(textItem)) {
                    url = textItem.text;
                  }
                }
                if (url) {
                  return (
                    <div className="flex flex-col items-start gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline break-all"
                      >
                        {url}
                      </a>
                      <img
                        src={url}
                        alt="Generated meme"
                        className="max-w-full rounded shadow border border-neutral-300 dark:border-neutral-700"
                        style={{ maxHeight: 300 }}
                      />
                    </div>
                  );
                }
                // Default rendering (as before)
                return (
                  <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
                    {(() => {
                      if (typeof result === "object" && result.content) {
                        return result.content
                          .map((item: { type: string; text: string }) => {
                            if (
                              item.type === "text" &&
                              item.text.startsWith("\n~ Page URL:")
                            ) {
                              const lines = item.text
                                .split("\n")
                                .filter(Boolean);
                              return lines
                                .map(
                                  (line: string) =>
                                    `- ${line.replace("\n~ ", "")}`
                                )
                                .join("\n");
                            }
                            return item.text;
                          })
                          .join("\n");
                      }
                      return JSON.stringify(result, null, 2);
                    })()}
                  </pre>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
