"use client";
import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  BookOpen,
  Users,
  Map,
  Lightbulb,
  PenTool,
  FileText,
  Eye,
} from "lucide-react";

const formSchema = z.object({
  kind: z.literal("fiction"),
  title: z.string().optional(),
  description: z.string().optional(),
  plot: z.string().optional(),
  // Story Foundation
  premise: z.string().optional(),
  genre_tone: z.string().optional(),
  theme: z.string().optional(),
  // Worldbuilding Layer
  settings: z.string().optional(),
  world_rules: z.string().optional(),
  culture_history: z.string().optional(),
  sensory_details: z.string().optional(),
  // Characters
  protagonist: z.string().optional(),
  antagonist: z.string().optional(),
  supporting_cast: z.string().optional(),
  character_relationships: z.string().optional(),
  // Plot Structure
  outline_beats: z.string().optional(),
  conflict: z.string().optional(),
  pacing_resolution: z.string().optional(),
  subplots: z.string().optional(),
  // Writing Flow & Style
  point_of_view: z.string().optional(),
  voice_tone: z.string().optional(),
});

type ProjectFormData = z.infer<typeof formSchema>;

const WIZARD_STEPS = [
  {
    id: 1,
    title: "Welcome",
    icon: BookOpen,
    description: "Get started with your fiction project",
  },
  {
    id: 2,
    title: "Basic Info",
    icon: FileText,
    description: "Title, description, and basic details",
  },
  {
    id: 3,
    title: "Story Foundation",
    icon: Lightbulb,
    description: "Premise, genre, and theme",
  },
  {
    id: 4,
    title: "Worldbuilding",
    icon: Map,
    description: "Settings, rules, and culture",
  },
  {
    id: 5,
    title: "Characters",
    icon: Users,
    description: "Protagonist, antagonist, and cast",
  },
  {
    id: 6,
    title: "Plot Structure",
    icon: BookOpen,
    description: "Outline, conflict, and pacing",
  },
  {
    id: 7,
    title: "Writing Style",
    icon: PenTool,
    description: "Point of view and voice",
  },
  {
    id: 8,
    title: "Review",
    icon: Eye,
    description: "Review and create your project",
  },
];

// Progress Bar Component
function ProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
        <div
          className="bg-[#F5B942] h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-4">
        {WIZARD_STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-200
                  ${
                    isCompleted
                      ? "bg-[#F5B942] text-[#1C2B3A]"
                      : isCurrent
                      ? "bg-[#1C2B3A] text-white"
                      : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500"
                  }
                `}
              >
                {isCompleted ? <Check size={16} /> : <StepIcon size={16} />}
              </div>
              <span
                className={`text-xs text-center max-w-[80px] leading-tight ${
                  isCurrent
                    ? "text-[#1C2B3A] dark:text-white font-medium"
                    : "text-neutral-500"
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Form Section Component
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-serif mb-2">{title}</h2>
        <p className="text-neutral-600 dark:text-neutral-300">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Input Field Component
function InputField({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
  rows = 3,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  const baseClassName =
    "w-full rounded-lg border border-neutral-300 dark:border-neutral-600 p-3 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:border-[#F5B942] focus:ring-1 focus:ring-[#F5B942] transition-colors";

  return (
    <label className="block">
      <div className="mb-2 font-medium text-neutral-700 dark:text-neutral-200">
        {label}
      </div>
      {multiline ? (
        <textarea
          className={baseClassName}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className={baseClassName}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && (
        <div className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {hint}
        </div>
      )}
    </label>
  );
}

export default function NewProject() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProjectFormData>({
    kind: "fiction",
  });
  const [loading, setLoading] = useState(false);

  const totalSteps = WIZARD_STEPS.length;
  const next = () => setStep((s) => Math.min(totalSteps, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const updateForm = (field: keyof ProjectFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const body = formSchema.parse(form);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const data = await res.json();
      router.push(`/app/project/${data.id}`);
    } catch (e) {
      console.error(e);
      alert("Could not create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-serif mb-8 text-center">
        Create Your Fiction Project
      </h1>

      <ProgressBar currentStep={step} totalSteps={totalSteps} />

      {/* Step 1: Welcome */}
      {step === 1 && (
        <FormSection
          title="Welcome to ZeroWriter"
          description="Let's create your fiction project step by step. Every field is optional - you can skip anything and come back later."
        >
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-6 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-[#F5B942]" />
            <h3 className="text-lg font-medium mb-2">
              Fiction Writing Made Easy
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300">
              We&rsquo;ll guide you through the essential elements of your story
              - from foundational concepts to detailed worldbuilding. Remember,
              you can always modify or expand these later in your workspace.
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F5B942] text-[#1C2B3A] font-medium hover:bg-[#F5B942]/90 transition-colors"
            >
              Let&rsquo;s Begin <ChevronRight size={16} />
            </button>
          </div>
        </FormSection>
      )}

      {/* Step 2: Basic Info */}
      {step === 2 && (
        <FormSection
          title="Basic Information"
          description="Start with the fundamentals of your project"
        >
          <InputField
            label="Project Title"
            placeholder="Enter your book title..."
            value={form.title ?? ""}
            onChange={(value) => updateForm("title", value)}
            hint="You can always change this later"
          />
          <InputField
            label="Description"
            placeholder="A brief description of your story..."
            value={form.description ?? ""}
            onChange={(value) => updateForm("description", value)}
            multiline
            rows={4}
            hint="What&rsquo;s your story about in a few sentences?"
          />
          <div className="flex justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F5B942] text-[#1C2B3A] font-medium hover:bg-[#F5B942]/90 transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </FormSection>
      )}

      {/* Step 3: Story Foundation */}
      {step === 3 && (
        <FormSection
          title="Story Foundation"
          description="Establish the core elements before writing full chapters"
        >
          <InputField
            label="Premise / Logline"
            placeholder="One or two sentences summarizing your story idea..."
            value={form.premise ?? ""}
            onChange={(value) => updateForm("premise", value)}
            multiline
            rows={2}
            hint="Example: 'A young wizard discovers he&rsquo;s the chosen one and must defeat an ancient evil while learning to control his powers.'"
          />
          <InputField
            label="Genre & Tone"
            placeholder="e.g., Fantasy Romance, Dark Comedy, Sci-Fi Thriller..."
            value={form.genre_tone ?? ""}
            onChange={(value) => updateForm("genre_tone", value)}
            hint="What genre and mood best describes your story?"
          />
          <InputField
            label="Theme"
            placeholder="The deeper message or question your story explores..."
            value={form.theme ?? ""}
            onChange={(value) => updateForm("theme", value)}
            multiline
            rows={3}
            hint="What universal truth, moral dilemma, or human condition does your story examine?"
          />
          <div className="flex justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F5B942] text-[#1C2B3A] font-medium hover:bg-[#F5B942]/90 transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </FormSection>
      )}

      {/* Step 4: Worldbuilding */}
      {step === 4 && (
        <FormSection
          title="Worldbuilding Layer"
          description="Create the world that will ground and immerse your readers"
        >
          <InputField
            label="Setting(s)"
            placeholder="Describe your locations, time period, and overall mood..."
            value={form.settings ?? ""}
            onChange={(value) => updateForm("settings", value)}
            multiline
            rows={4}
            hint="Where and when does your story take place? What's the atmosphere like?"
          />
          <InputField
            label="World Rules"
            placeholder="Magic system, technology level, laws, politics..."
            value={form.world_rules ?? ""}
            onChange={(value) => updateForm("world_rules", value)}
            multiline
            rows={4}
            hint="What are the fundamental rules that govern your world?"
          />
          <InputField
            label="Culture & History"
            placeholder="Customs, myths, conflicts, economy, social structures..."
            value={form.culture_history ?? ""}
            onChange={(value) => updateForm("culture_history", value)}
            multiline
            rows={4}
            hint="What shaped this world and its people over time?"
          />
          <InputField
            label="Sensory Details"
            placeholder="Smells, sounds, textures, climate, unique features..."
            value={form.sensory_details ?? ""}
            onChange={(value) => updateForm("sensory_details", value)}
            multiline
            rows={3}
            hint="What makes this world feel real and immersive to the reader?"
          />
          <div className="flex justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F5B942] text-[#1C2B3A] font-medium hover:bg-[#F5B942]/90 transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </FormSection>
      )}

      {/* Step 5: Characters */}
      {step === 5 && (
        <FormSection
          title="Characters"
          description="Develop the people who will drive your story forward"
        >
          <InputField
            label="Protagonist"
            placeholder="Goals, motivations, flaws, growth arc..."
            value={form.protagonist ?? ""}
            onChange={(value) => updateForm("protagonist", value)}
            multiline
            rows={4}
            hint="Who is your main character? What do they want and what's stopping them?"
          />
          <InputField
            label="Antagonist"
            placeholder="Opposition force, motivations, strengths..."
            value={form.antagonist ?? ""}
            onChange={(value) => updateForm("antagonist", value)}
            multiline
            rows={4}
            hint="Who or what opposes your protagonist? What makes them compelling?"
          />
          <InputField
            label="Supporting Cast"
            placeholder="Friends, mentors, rivals, family members..."
            value={form.supporting_cast ?? ""}
            onChange={(value) => updateForm("supporting_cast", value)}
            multiline
            rows={4}
            hint="Who else plays important roles in your story?"
          />
          <InputField
            label="Character Relationships"
            placeholder="How characters affect each other's journeys..."
            value={form.character_relationships ?? ""}
            onChange={(value) => updateForm("character_relationships", value)}
            multiline
            rows={3}
            hint="What are the key dynamics and connections between characters?"
          />
          <div className="flex justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F5B942] text-[#1C2B3A] font-medium hover:bg-[#F5B942]/90 transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </FormSection>
      )}

      {/* Step 6: Plot Structure */}
      {step === 6 && (
        <FormSection
          title="Plot Structure"
          description="Map out the journey your story will take"
        >
          <InputField
            label="Outline / Beats"
            placeholder="Major events, turning points, key scenes..."
            value={form.outline_beats ?? ""}
            onChange={(value) => updateForm("outline_beats", value)}
            multiline
            rows={5}
            hint="What are the major story beats from beginning to end?"
          />
          <InputField
            label="Conflict"
            placeholder="Internal and external challenges..."
            value={form.conflict ?? ""}
            onChange={(value) => updateForm("conflict", value)}
            multiline
            rows={3}
            hint="What inner and outer obstacles will your characters face?"
          />
          <InputField
            label="Rising Action → Climax → Resolution"
            placeholder="How tension builds, peaks, and resolves..."
            value={form.pacing_resolution ?? ""}
            onChange={(value) => updateForm("pacing_resolution", value)}
            multiline
            rows={4}
            hint="How does your story build toward its climactic moment and conclusion?"
          />
          <InputField
            label="Subplots"
            placeholder="Secondary threads that enhance the main story..."
            value={form.subplots ?? ""}
            onChange={(value) => updateForm("subplots", value)}
            multiline
            rows={3}
            hint="What side stories weave through and support your main plot?"
          />
          <div className="flex justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F5B942] text-[#1C2B3A] font-medium hover:bg-[#F5B942]/90 transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        </FormSection>
      )}

      {/* Step 7: Writing Style */}
      {step === 7 && (
        <FormSection
          title="Writing Flow & Style"
          description="Define the voice and perspective of your storytelling"
        >
          <InputField
            label="Point of View"
            placeholder="1st person, 3rd person limited, omniscient, etc..."
            value={form.point_of_view ?? ""}
            onChange={(value) => updateForm("point_of_view", value)}
            hint="From whose perspective will the story be told?"
          />
          <InputField
            label="Voice & Tone"
            placeholder="The 'feel' and personality of your writing..."
            value={form.voice_tone ?? ""}
            onChange={(value) => updateForm("voice_tone", value)}
            multiline
            rows={4}
            hint="What&rsquo;s the distinctive style and emotional quality of your narration?"
          />
          <div className="flex justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#F5B942] text-[#1C2B3A] font-medium hover:bg-[#F5B942]/90 transition-colors"
            >
              Review & Continue <ChevronRight size={16} />
            </button>
          </div>
        </FormSection>
      )}

      {/* Step 8: Review */}
      {step === 8 && (
        <FormSection
          title="Review Your Project"
          description="Everything looks good? Let's create your writing workspace!"
        >
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-6">
            <h3 className="font-medium mb-4">Project Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {form.title && (
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">
                    Title:
                  </span>
                  <div className="mt-1">{form.title}</div>
                </div>
              )}
              {form.genre_tone && (
                <div>
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">
                    Genre:
                  </span>
                  <div className="mt-1">{form.genre_tone}</div>
                </div>
              )}
              {form.premise && (
                <div className="md:col-span-2">
                  <span className="font-medium text-neutral-600 dark:text-neutral-400">
                    Premise:
                  </span>
                  <div className="mt-1">{form.premise}</div>
                </div>
              )}
            </div>
            <div className="mt-4 p-4 bg-[#F5B942]/10 rounded-lg">
              <div className="flex items-center gap-2 text-[#1C2B3A] dark:text-[#F5B942] font-medium">
                <BookOpen size={16} />
                Ready to Start Writing!
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                Your project will be organized with dedicated sections for all
                the elements you&rsquo;ve defined. You can edit or expand any of
                these at any time in your workspace.
              </p>
            </div>
          </div>
          <div className="flex justify-between">
            <button
              onClick={back}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-[#1C2B3A] text-white font-medium hover:bg-[#1C2B3A]/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project"}{" "}
              <BookOpen size={16} />
            </button>
          </div>
        </FormSection>
      )}
    </div>
  );
}
