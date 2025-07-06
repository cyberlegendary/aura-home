import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, StickyNote, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EmojiPicker } from "./EmojiPicker";

interface Job {
  id: string;
  jobNumber: string;
  title: string;
}

interface JobNote {
  id: string;
  note: string;
  createdAt: string;
  createdBy: string;
  isExtensionRequest?: boolean;
}

interface JobNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onNoteAdded?: () => void;
}

export function JobNotesModal({
  open,
  onOpenChange,
  job,
  onNoteAdded,
}: JobNotesModalProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && job) {
      fetchNotes();
    }
  }, [open, job]);

  const fetchNotes = async () => {
    if (!job) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      } else {
        throw new Error("Failed to fetch notes");
      }
    } catch (err) {
      setError("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !newNote.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/jobs/${job.id}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: newNote.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      setNewNote("");
      fetchNotes();
      onNoteAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Job Notes - {job.jobNumber}
          </DialogTitle>
          <DialogDescription>
            View and add notes for {job.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading notes...</span>
            </div>
          ) : notes.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No notes yet. Add the first one below.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm">{note.note}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(note.createdAt)} by {note.createdBy}
                          {note.isExtensionRequest && (
                            <Badge variant="secondary" className="ml-2">
                              Extension Request
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="newNote">Add New Note</Label>
            <Textarea
              id="newNote"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your note..."
              rows={3}
              required
            />
            {user?.role === "staff" && (
              <div className="flex justify-between items-center">
                <EmojiPicker
                  onEmojiSelect={(emoji) => setNewNote((prev) => prev + emoji)}
                />
                <span className="text-xs text-gray-500">
                  Staff can add emojis to notes
                </span>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button type="submit" disabled={isSubmitting || !newNote.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Note"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
