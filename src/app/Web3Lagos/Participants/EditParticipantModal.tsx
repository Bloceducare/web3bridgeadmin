import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import {  Participant, EditParticipantModalProps } from "./types";


export default function EditParticipantModal({
  isOpen,
  onClose,
  participant,
  onSubmit,
  courses,
  cohorts,
  isLoading,
}: EditParticipantModalProps) {
  const [editFormData, setEditFormData] = useState<Partial<Participant>>({});
  const [selectedCourse, setSelectedCourse] = useState<{
    id: number;
    registration: number;
  } | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Reset form data when participant changes
  useEffect(() => {
    if (participant) {
      setEditFormData({
        name: participant.name,
        email: participant.email,
        wallet_address: participant.wallet_address,
        github: participant.github,
        city: participant.city,
        state: participant.state,
        country: participant.country,
        gender: participant.gender,
        motivation: participant.motivation,
        achievement: participant.achievement,
        payment_status: participant.payment_status,
        number: participant.number,
      });

      // Set selected course
      if (participant.course && typeof participant.course === "object") {
        setSelectedCourse({
          id: participant.course.id,
          registration: participant.course.registration,
        });
      }

      // Set selected cohort
      const participantCohort = cohorts.find(
        (c) => c.cohort === participant.cohort || c.name === participant.cohort
      );
      if (participantCohort) {
        setSelectedCohort({
          id: participantCohort.id,
          name: participantCohort.name,
        });
      }
    }
  }, [participant, cohorts]);

  const handleCourseSelect = (course: { id: number; registration: number }) => {
    setSelectedCourse(course);
  };

  const handleCohortSelect = (cohort: { id: number; name: string }) => {
    setSelectedCohort(cohort);
  };

  const handleSave = async () => {
    if (!participant) return;

    // Create a copy of the edit form data
    const dataToSend = { ...editFormData };

    // Prepare the data for API
    let apiData: any = { ...dataToSend };

    // Set the course ID correctly
    if (selectedCourse) {
      apiData.course = selectedCourse.id;
    }

    // Use the cohort name as the value to send to the API
    if (selectedCohort) {
      apiData.cohort = selectedCohort.name;
    }

    await onSubmit(apiData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle>Edit Participant</DialogTitle>
          <DialogDescription>Update participant details</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 my-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-course" className="text-right">
                Course
              </Label>
              <Select
                defaultValue={participant?.course?.name}
                onValueChange={(value) => {
                  const selectedCourseObj = courses.find(
                    (course) => course.name === value
                  );
                  if (selectedCourseObj) {
                    handleCourseSelect({
                      id: selectedCourseObj.id,
                      registration: selectedCourseObj.registration,
                    });
                  }
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.name}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-cohort" className="text-right">
                Cohort
              </Label>
              <Select
                value={selectedCohort?.name || ""}
                onValueChange={(value) => {
                  const cohortObject = cohorts.find(
                    (cohort) => cohort.name === value
                  );
                  if (cohortObject) {
                    handleCohortSelect({
                      id: cohortObject.id,
                      name: cohortObject.name,
                    });
                  }
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select cohort" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.name}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {[
              { label: "Name", key: "name" },
              { label: "Email", key: "email" },
              { label: "Wallet Address", key: "wallet_address" },
              { label: "GitHub", key: "github" },
              { label: "City", key: "city" },
              { label: "State", key: "state" },
              { label: "Country", key: "country" },
              { label: "Motivation", key: "motivation" },
              { label: "Achievement", key: "achievement" },
              { label: "Phone Number", key: "number" },
            ].map(({ label, key }) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right">
                  {label}
                </Label>
                <Input
                  id={key}
                  value={String(editFormData[key as keyof Participant] || "")}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
            ))}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-gender" className="text-right">
                Gender
              </Label>
              <Select
                value={editFormData.gender}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    gender: value,
                  }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-payment_status" className="text-right">
                Payment Status
              </Label>
              <Select
                value={editFormData.payment_status ? "true" : "false"}
                onValueChange={(value) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    payment_status: value === "true",
                  }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Paid</SelectItem>
                  <SelectItem value="false">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-none border-t pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}