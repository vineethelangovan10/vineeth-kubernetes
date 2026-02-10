import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCluster } from "@/hooks/useCluster";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText } from "lucide-react";

export default function AddCluster() {
  const [name, setName] = useState("");
  const [kubeconfig, setKubeconfig] = useState("");
  const [loading, setLoading] = useState(false);
  const { addCluster } = useCluster();
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setKubeconfig(ev.target?.result as string);
      if (!name) setName(file.name.replace(/\.(ya?ml|conf|config)$/i, ""));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await addCluster(name, kubeconfig);
    setLoading(false);
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Cluster</h1>
        <p className="text-muted-foreground">Connect a Kubernetes cluster by uploading your kubeconfig</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kubeconfig</CardTitle>
          <CardDescription>Upload your kubeconfig file or paste its contents</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Cluster Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="my-cluster" required />
            </div>

            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => document.getElementById("file-upload")?.click()}>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .yaml, .yml, .conf files</p>
                <input id="file-upload" type="file" className="hidden" accept=".yaml,.yml,.conf,.config" onChange={handleFileUpload} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kubeconfig">Or paste kubeconfig content</Label>
              <Textarea
                id="kubeconfig"
                value={kubeconfig}
                onChange={(e) => setKubeconfig(e.target.value)}
                placeholder="apiVersion: v1&#10;kind: Config&#10;..."
                className="font-mono text-xs min-h-[200px]"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || !name || !kubeconfig}>
                {loading ? "Connecting..." : "Connect Cluster"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
