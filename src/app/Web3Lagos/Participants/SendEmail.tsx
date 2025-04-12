import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { subject: string; message: string }) => void;
  recipientCount: number;
  isLoading: boolean;
}

export default function SendEmailModal({
  isOpen,
  onClose,
  onSend,
  recipientCount,
  isLoading,
}: SendEmailModalProps) {
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(formData);
  };

  const resetForm = () => {
    setFormData({
      subject: "",
      message: "",
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Template options for quick email composition
  const emailTemplates = [
    {
      name: "Payment Reminder",
      subject: "Payment Reminder for Your Course",
      message: `Dear Participant,

This is a friendly reminder that we haven't received your payment for the course yet. Please complete your payment at your earliest convenience to secure your spot.

Payment Details:
- Course: [Course Name]
- Cohort: [Cohort Name]
- Payment Link: [Payment Link]

If you have any questions or need assistance with the payment process, please don't hesitate to contact us.

Best regards,
Web3Bridge Team`,
    },
  ];

  const applyTemplate = (template: (typeof emailTemplates)[0]) => {
    setFormData({
      subject: template.subject,
      message: template.message,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Compose an email to send to {recipientCount} selected participant
            {recipientCount !== 1 && "s"}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={8}
              placeholder="Compose your email message here..."
              className="resize-y min-h-32"
            />
          </div>

          <div className="space-y-2">
            <Label>Templates</Label>
            <div className="flex flex-wrap gap-2">
              {emailTemplates.map((template, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-between mt-4">
            <div className="text-sm text-gray-500">
              This will send to {recipientCount} recipient
              {recipientCount !== 1 && "s"}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
