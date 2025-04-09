"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Participant, CreateParticipantModalProps } from "./types";

export default function CreateParticipantModal({
  isOpen,
  onClose,
  onSubmit,
  courses,
  cohorts,
  isLoading,
}: CreateParticipantModalProps) {
  const [createFormData, setCreateFormData] = useState<Partial<Participant>>({
    name: "",
    email: "",
    wallet_address: "",
    github: "",
    city: "",
    state: "",
    country: "",
    gender: "",
    motivation: "",
    achievement: "",
    payment_status: false,
    registration: undefined,
    number: "",
  });
  const [selectedCourse, setSelectedCourse] = useState<{
    id: number;
    registration: number;
  } | null>(null);

  const [selectedCohort, setSelectedCohort] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleCourseSelect = (course: { id: number; registration: number }) => {
    setSelectedCourse(course);
  };

  const handleCohortSelect = (cohort: { id: number; name: string }) => {
    setSelectedCohort(cohort);
  };

  const handleCreate = async () => {
    if (!selectedCourse) {
      alert("Please select a course first");
      return;
    }

  
    const payload = {
      ...createFormData,
      course: selectedCourse.id,
      registration: selectedCourse.registration,
      cohort: selectedCohort?.name,
    };
    await onSubmit(payload as any);
    setCreateFormData({
      name: "",
      email: "",
      wallet_address: "",
      github: "",
      city: "",
      state: "",
      country: "",
      gender: "",
      motivation: "",
      achievement: "",
      payment_status: false,
      number: "",
    });
    setSelectedCourse(null);
    setSelectedCohort(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle>Create New Participant</DialogTitle>
          <DialogDescription>
            Enter the details for the new participant
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 my-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-course" className="text-right">
                Course
              </Label>
              <Select
                onValueChange={(value) => {
                  const selectedCourse = courses.find(
                    (course) => course.name === value
                  );
                  if (selectedCourse) {
                    handleCourseSelect({
                      id: selectedCourse.id,
                      registration: selectedCourse.registration,
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
              <Label htmlFor="create-cohort" className="text-right">
                Cohort
              </Label>
              <Select
                onValueChange={(value) => {
                  const selectedCohort = cohorts.find(
                    (cohort) => cohort.name === value
                  );
                  if (selectedCohort) {
                    handleCohortSelect({
                      id: selectedCohort.id,
                      name: selectedCohort.name,
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
                <Label htmlFor={`create-${key}`} className="text-right">
                  {label}
                </Label>
                <Input
                  id={`create-${key}`}
                  value={String(createFormData[key as keyof Participant] || "")}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
            ))}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="create-gender" className="text-right">
                Gender
              </Label>
              <Select
                value={createFormData.gender}
                onValueChange={(value) =>
                  setCreateFormData((prev) => ({
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
              <Label htmlFor="create-payment_status" className="text-right">
                Payment Status
              </Label>
              <Select
                value={createFormData.payment_status ? "true" : "false"}
                onValueChange={(value) =>
                  setCreateFormData((prev) => ({
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
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading}
            className="bg-primary"
          >
            {isLoading ? "Creating..." : "Create Participant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
