import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  FolderOpen,
  UserPlus,
  Link as LinkIcon,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/** Same tutorial carousel as the dashboard — extracted for layout reordering only. */
const DashboardTutorialCarousel = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
      className="mb-10 mt-2"
    >
      <div className="mb-8 text-center">
        <h2 className="mb-2 font-serif text-2xl font-semibold text-foreground">
          {t("dashboard.guidedSteps") || t("dashboard.tutorialTitle") || "How to Get Started"}
        </h2>
        <p className="text-muted-foreground">
          {t("dashboard.guidedStepsSubtitle") || t("dashboard.tutorialSubtitle") || "Follow these simple steps to create and manage your digital will"}
        </p>
      </div>

      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="card-elevated h-full">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-xs font-medium text-primary">
                        {t("dashboard.tutorial.step1") || "Step 1"}
                      </div>
                      <CardTitle className="text-lg">{t("dashboard.tutorial.createWill") || "Create Your Will"}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {t("dashboard.tutorial.createWillDescription") || "Choose your preferred method to create your will — audio, video, or manual form."}
                  </CardDescription>
                  <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.createWillStep1") || "Click 'New Will' or go to Create section"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.createWillStep2") || "Select Audio, Video, or Manual Form"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.createWillStep3") || "Record or type your wishes"}</span>
                    </li>
                  </ul>
                  <Link to="/create">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      {t("dashboard.tutorial.getStarted") || "Get Started"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>

            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="card-elevated h-full">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-light">
                      <FolderOpen className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-xs font-medium text-navy">{t("dashboard.tutorial.step2") || "Step 2"}</div>
                      <CardTitle className="text-lg">{t("dashboard.tutorial.addAssets") || "Add Your Assets"}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {t("dashboard.tutorial.addAssetsDescription") || "List all your assets including property, investments, vehicles, and more."}
                  </CardDescription>
                  <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.addAssetsStep1") || "Go to Assets section from Quick Actions"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.addAssetsStep2") || "Click 'Add Asset' button"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.addAssetsStep3") || "Fill in asset details and save"}</span>
                    </li>
                  </ul>
                  <Link to="/assets">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      {t("dashboard.tutorial.manageAssets") || "Manage Assets"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>

            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="card-elevated h-full">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sage-dark to-sage">
                      <UserPlus className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-xs font-medium text-sage-dark">{t("dashboard.tutorial.step3") || "Step 3"}</div>
                      <CardTitle className="text-lg">{t("dashboard.tutorial.createRecipients") || "Create Recipients"}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {t("dashboard.tutorial.createRecipientsDescription") || "Add the people who will receive your assets and messages."}
                  </CardDescription>
                  <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.createRecipientsStep1") || "Click 'Manage' in Recipients section"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.createRecipientsStep2") || "Click 'Add Recipient' button"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.createRecipientsStep3") || "Enter name, email, phone, and relationship"}</span>
                    </li>
                  </ul>
                  <Link to="/recipients">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      {t("dashboard.tutorial.manageRecipients") || "Manage Recipients"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>

            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="card-elevated h-full">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-light">
                      <LinkIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-xs font-medium text-primary">{t("dashboard.tutorial.step4") || "Step 4"}</div>
                      <CardTitle className="text-lg">{t("dashboard.tutorial.assignRecipients") || "Assign Recipients"}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {t("dashboard.tutorial.assignRecipientsDescription") || "Link your assets to the recipients who should receive them."}
                  </CardDescription>
                  <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.assignRecipientsStep1") || "Go to Assets section"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.assignRecipientsStep2") || "Click 'Assign Recipients' on any asset"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.assignRecipientsStep3") || "Select recipients and save"}</span>
                    </li>
                  </ul>
                  <Link to="/assets">
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      {t("dashboard.tutorial.assignNow") || "Assign Now"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>

            <CarouselItem className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <Card className="card-elevated h-full">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sage-dark to-sage">
                      <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-xs font-medium text-sage-dark">{t("dashboard.tutorial.step5") || "Step 5"}</div>
                      <CardTitle className="text-lg">{t("dashboard.tutorial.reviewFinalize") || "Review & Finalize"}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {t("dashboard.tutorial.reviewFinalizeDescription") || "Review all sections of your will and finalize it."}
                  </CardDescription>
                  <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.reviewFinalizeStep1") || "Go to Review Will section"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.reviewFinalizeStep2") || "Check all sections are complete"}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-sage-dark" />
                      <span>{t("dashboard.tutorial.reviewFinalizeStep3") || "Click 'Finalize Will' to complete"}</span>
                    </li>
                  </ul>
                  <Link to="/review">
                    <Button variant="gold" size="sm" className="w-full gap-2">
                      {t("dashboard.tutorial.reviewNow") || "Review Now"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="-left-12 hidden md:flex" />
          <CarouselNext className="-right-12 hidden md:flex" />
        </Carousel>
      </div>
    </motion.div>
  );
};

export default DashboardTutorialCarousel;
