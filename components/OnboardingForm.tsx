"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

export function OnboardingForm({ currentUser }: { currentUser: any }) {
    const { user } = useUser();
    const currentClerkId = user?.id;
    const onboardUser = useMutation(api.users.onboardUser);

    const [name, setName] = useState(currentUser.name || user?.firstName || "");
    const [age, setAge] = useState<string>("");
    const [gender, setGender] = useState<string>("male");
    const [error, setError] = useState<string>("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentClerkId) return;

        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 18) {
            setError("You must be at least 18 years old to join.");
            return;
        }

        if (!name.trim()) {
            setError("Please provide your name.");
            return;
        }

        try {
            await onboardUser({
                currentClerkId,
                name: name.trim(),
                age: ageNum,
                gender,
            });
            setError("");
        } catch (err: any) {
            setError(err.message || "An error occurred during onboarding.");
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl shadow-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome!</h1>
                <p className="text-gray-500 mb-8">Let's finish setting up your profile before you start swiping.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Your Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="What should we call you?"
                            className="rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="age" className="text-sm font-semibold text-gray-700">Your Age</Label>
                        <Input
                            id="age"
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="18+"
                            min="1"
                            max="120"
                            className="rounded-xl bg-gray-50 border-gray-200 focus-visible:ring-blue-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">Your Gender</Label>
                        <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
                            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-100 transition flex-1">
                                <RadioGroupItem value="male" id="male" />
                                <Label htmlFor="male" className="cursor-pointer">Male</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl cursor-pointer hover:bg-gray-100 transition flex-1">
                                <RadioGroupItem value="female" id="female" />
                                <Label htmlFor="female" className="cursor-pointer">Female</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full rounded-xl h-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all">
                        Continue to App
                    </Button>
                </form>
            </div>
        </div>
    );
}
