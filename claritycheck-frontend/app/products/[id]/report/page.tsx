// src/app/products/[id]/report/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";
import ReportPreview from "@/src/components/ReportPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getProduct, fetchLatestFollowups } from "@/src/lib/api";
import { Product, FollowupQuestion } from "@/src/types";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import { analyzeProduct, type AnalysisResult } from "@/src/lib/reportEngine";

// PDF libs
import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [questions, setQuestions] = useState<FollowupQuestion[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const reportRef = useRef<HTMLDivElement | null>(null);

  // -----------------------------
  // LOAD DATA
  // -----------------------------
  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productData, questionData] = await Promise.all([
        getProduct(productId),
        fetchLatestFollowups(productId),
      ]);

      setProduct(productData);

      const list = Array.isArray(questionData)
        ? questionData
        : questionData.followups || [];

      setQuestions(list);

      // Run transparency analysis
      const result = analyzeProduct(productData, list);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // PDF GENERATOR
  // -----------------------------
  const handleDownloadPDF = async () => {
    if (!reportRef.current || !product) return;

    setDownloading(true);

    try {
      const dataUrl = await htmlToImage.toPng(reportRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const pdf = new jsPDF("p", "mm", "a4");

      const props = pdf.getImageProperties(dataUrl);
      const width = pdf.internal.pageSize.getWidth();
      const height = (props.height * width) / props.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`${product.name}-clarity-report.pdf`);
    } catch (err) {
      console.error("PDF ERROR:", err);
      alert("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const answeredCount = questions.filter(
    (q) => q.answer && q.answer.trim() !== ""
  ).length;

  // -----------------------------
  // LOADING SCREEN
  // -----------------------------
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 py-12">
          <div className="mx-auto max-w-2xl px-4">
            <Card className="h-96 animate-pulse bg-muted" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // -----------------------------
  // MAIN UI
  // -----------------------------
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* BACK BUTTON */}
          <motion.div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </motion.div>

          {/* TITLE */}
          <motion.div className="mb-8">
            <h1 className="text-3xl font-bold">Transparency Report</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Your product transparency assessment is ready
            </p>
          </motion.div>

          {/* ERROR BOX */}
          {error && (
            <div className="mb-6 flex gap-3 rounded-lg border border-red-500 bg-red-100 p-4">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">{error}</p>
                <Button size="sm" variant="outline" onClick={loadData}>
                  <Loader2 className="h-3 w-3 animate-spin" /> Retry
                </Button>
              </div>
            </div>
          )}

          {/* PDF CONTENT */}
          <div ref={reportRef}>
            {product && (
              <ReportPreview
                productName={product.name}
                productClaim={product.claim}
                category={product.category}
                answeredQuestions={answeredCount}
                totalQuestions={questions.length}
                analysis={analysis || undefined}
                onDownload={handleDownloadPDF}
                loading={downloading}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
