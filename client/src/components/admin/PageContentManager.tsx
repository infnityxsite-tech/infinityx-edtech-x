import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export default function PageContentManager() {
  const [activeTab, setActiveTab] = useState("home");

  // 🏠 HOME CONTENT STATE - Only fields for Home page
  const [homeContent, setHomeContent] = useState({
    headline: "",
    subHeadline: "",
    studentsTrained: 0,
    expertInstructors: 0,
    jobPlacementRate: 0,
    heroImageUrl: "",
    visionImageUrl: "",
  });

  // ℹ️ ABOUT CONTENT STATE - Only fields for About page
  const [aboutContent, setAboutContent] = useState({
    missionText: "",
    visionText: "",
    founderBio: "",
    founderMessage: "",
    aboutCompany: "",
    bannerImageUrl: "",
    founderImageUrl: "",
    companyImageUrl: "",
    missionImageUrl: "",
  });

  const utils = trpc.useUtils();

  // Fetch content from DB
  const { data: homeData, isLoading: homeLoading } =
    trpc.admin.getPageContent.useQuery({ pageKey: "home" });

  const { data: aboutData, isLoading: aboutLoading } =
    trpc.admin.getPageContent.useQuery({ pageKey: "about" });

  const updatePageMutation = trpc.admin.updatePageContent.useMutation({
    onSuccess: () => {
      toast.success("✅ Page content updated successfully!");
      utils.admin.getPageContent.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "❌ Failed to update page content");
    },
  });

  // Load data
  useEffect(() => {
    if (homeData) {
      setHomeContent({
        headline: homeData.headline || "",
        subHeadline: homeData.subHeadline || "",
        studentsTrained: homeData.studentsTrained || 0,
        expertInstructors: homeData.expertInstructors || 0,
        jobPlacementRate: homeData.jobPlacementRate || 0,
        heroImageUrl: homeData.heroImageUrl || "",
        visionImageUrl: homeData.visionImageUrl || "",
      });
    }
  }, [homeData]);

  useEffect(() => {
    if (aboutData) {
      setAboutContent({
        missionText: aboutData.missionText || "",
        visionText: aboutData.visionText || "",
        founderBio: aboutData.founderBio || "",
        founderMessage: aboutData.founderMessage || "",
        aboutCompany: aboutData.aboutCompany || "",
        bannerImageUrl: aboutData.bannerImageUrl || "",
        founderImageUrl: aboutData.founderImageUrl || "",
        companyImageUrl: aboutData.companyImageUrl || "",
        missionImageUrl: aboutData.missionImageUrl || "",
      });
    }
  }, [aboutData]);

  // 📤 Handle file uploads
  // 📤 Handle file uploads (safe JSON parsing)
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: "home" | "about",
    key: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("❌ Please upload an image file");
      return;
    }
  
    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("❌ File too large. Maximum size is 20MB");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
  
    const uploadToast = toast.loading("⏳ Uploading image...");
  
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
  
      // ✅ Safely parse JSON to avoid "Unexpected end of JSON input"
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned an invalid or empty response");
      }
  
      if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
      }
  
      if (!data?.url) {
        throw new Error("Upload succeeded but no file URL was returned");
      }
  
      const imageUrl = data.url;
      toast.success("✅ Image uploaded successfully!", { id: uploadToast });
  
      if (section === "home") {
        setHomeContent((prev) => ({ ...prev, [key]: imageUrl }));
      } else {
        setAboutContent((prev) => ({ ...prev, [key]: imageUrl }));
      }
    } catch (err: any) {
      console.error("❌ Upload error:", err);
      toast.error(err.message || "❌ Failed to upload image", { id: uploadToast });
    }
  };


  // Save handlers
  const handleSaveHome = () => {
    updatePageMutation.mutate({ 
      pageKey: "home", 
      ...homeContent 
    });
  };
  
  const handleSaveAbout = () => {
    updatePageMutation.mutate({ 
      pageKey: "about", 
      ...aboutContent 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Content Manager</CardTitle>
        <CardDescription>
          Manage text and images for your Home and About pages
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home">🏠 Home Page</TabsTrigger>
            <TabsTrigger value="about">ℹ️ About Page</TabsTrigger>
          </TabsList>

          {/* ================= HOME PAGE ================= */}
          <TabsContent value="home" className="space-y-6 mt-6">
            {homeLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* Home Page Images */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hero Image */}
                    <div className="space-y-2">
                      <Label htmlFor="home-hero">Hero Image (Main Banner)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="home-hero"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "home", "heroImageUrl")}
                          className="cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-gray-500" />
                      </div>
                      {homeContent.heroImageUrl && (
                        <div className="relative">
                          <img
                            src={homeContent.heroImageUrl}
                            alt="Hero"
                            className="w-full h-40 object-cover rounded-md shadow border"
                          />
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            ✓ Uploaded
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Vision Image */}
                    <div className="space-y-2">
                      <Label htmlFor="home-vision">Vision Section Image</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="home-vision"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "home", "visionImageUrl")}
                          className="cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-gray-500" />
                      </div>
                      {homeContent.visionImageUrl && (
                        <div className="relative">
                          <img
                            src={homeContent.visionImageUrl}
                            alt="Vision"
                            className="w-full h-40 object-cover rounded-md shadow border"
                          />
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            ✓ Uploaded
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Text Content</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="home-headline">Headline</Label>
                    <Input
                      id="home-headline"
                      value={homeContent.headline}
                      onChange={(e) =>
                        setHomeContent({ ...homeContent, headline: e.target.value })
                      }
                      placeholder="Empowering the Next Generation of Tech Leaders"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="home-subheadline">Sub-Headline</Label>
                    <Textarea
                      id="home-subheadline"
                      rows={3}
                      value={homeContent.subHeadline}
                      onChange={(e) =>
                        setHomeContent({ ...homeContent, subHeadline: e.target.value })
                      }
                      placeholder="Join thousands of students who have transformed their careers..."
                    />
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="students-trained">Students Trained</Label>
                      <Input
                        id="students-trained"
                        type="number"
                        value={homeContent.studentsTrained}
                        onChange={(e) =>
                          setHomeContent({
                            ...homeContent,
                            studentsTrained: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expert-instructors">Expert Instructors</Label>
                      <Input
                        id="expert-instructors"
                        type="number"
                        value={homeContent.expertInstructors}
                        onChange={(e) =>
                          setHomeContent({
                            ...homeContent,
                            expertInstructors: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job-placement">Job Placement Rate (%)</Label>
                      <Input
                        id="job-placement"
                        type="number"
                        value={homeContent.jobPlacementRate}
                        onChange={(e) =>
                          setHomeContent({
                            ...homeContent,
                            jobPlacementRate: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveHome}
                  disabled={updatePageMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {updatePageMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "💾 Save Home Page Content"
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          {/* ================= ABOUT PAGE ================= */}
          <TabsContent value="about" className="space-y-6 mt-6">
            {aboutLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* About Page Images */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Images</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Banner Image */}
                    <div className="space-y-2">
                      <Label htmlFor="about-banner">Banner Image</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="about-banner"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "about", "bannerImageUrl")}
                          className="cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-gray-500" />
                      </div>
                      {aboutContent.bannerImageUrl && (
                        <div className="relative">
                          <img
                            src={aboutContent.bannerImageUrl}
                            alt="Banner"
                            className="w-full h-40 object-cover rounded-md shadow border"
                          />
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            ✓ Uploaded
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Founder Image */}
                    <div className="space-y-2">
                      <Label htmlFor="about-founder">Founder Image</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="about-founder"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "about", "founderImageUrl")}
                          className="cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-gray-500" />
                      </div>
                      {aboutContent.founderImageUrl && (
                        <div className="relative">
                          <img
                            src={aboutContent.founderImageUrl}
                            alt="Founder"
                            className="w-full h-40 object-cover rounded-md shadow border"
                          />
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            ✓ Uploaded
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Company Image */}
                    <div className="space-y-2">
                      <Label htmlFor="about-company">Company Image</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="about-company"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "about", "companyImageUrl")}
                          className="cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-gray-500" />
                      </div>
                      {aboutContent.companyImageUrl && (
                        <div className="relative">
                          <img
                            src={aboutContent.companyImageUrl}
                            alt="Company"
                            className="w-full h-40 object-cover rounded-md shadow border"
                          />
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            ✓ Uploaded
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mission Image */}
                    <div className="space-y-2">
                      <Label htmlFor="about-mission">Mission Image</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="about-mission"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "about", "missionImageUrl")}
                          className="cursor-pointer"
                        />
                        <Upload className="w-4 h-4 text-gray-500" />
                      </div>
                      {aboutContent.missionImageUrl && (
                        <div className="relative">
                          <img
                            src={aboutContent.missionImageUrl}
                            alt="Mission"
                            className="w-full h-40 object-cover rounded-md shadow border"
                          />
                          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            ✓ Uploaded
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Company Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="about-company-text">About Company</Label>
                    <Textarea
                      id="about-company-text"
                      rows={4}
                      value={aboutContent.aboutCompany}
                      onChange={(e) =>
                        setAboutContent({ ...aboutContent, aboutCompany: e.target.value })
                      }
                      placeholder="Tell your company's story..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founder-bio">Founder Bio</Label>
                    <Textarea
                      id="founder-bio"
                      rows={3}
                      value={aboutContent.founderBio}
                      onChange={(e) =>
                        setAboutContent({ ...aboutContent, founderBio: e.target.value })
                      }
                      placeholder="Brief biography of the founder..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founder-message">Founder Message</Label>
                    <Textarea
                      id="founder-message"
                      rows={3}
                      value={aboutContent.founderMessage}
                      onChange={(e) =>
                        setAboutContent({ ...aboutContent, founderMessage: e.target.value })
                      }
                      placeholder="A message from the founder..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mission-text">Mission Statement</Label>
                    <Textarea
                      id="mission-text"
                      rows={3}
                      value={aboutContent.missionText}
                      onChange={(e) =>
                        setAboutContent({ ...aboutContent, missionText: e.target.value })
                      }
                      placeholder="Our mission is to..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vision-text">Vision Statement</Label>
                    <Textarea
                      id="vision-text"
                      rows={3}
                      value={aboutContent.visionText}
                      onChange={(e) =>
                        setAboutContent({ ...aboutContent, visionText: e.target.value })
                      }
                      placeholder="Our vision is to..."
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveAbout}
                  disabled={updatePageMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {updatePageMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "💾 Save About Page Content"
                  )}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
