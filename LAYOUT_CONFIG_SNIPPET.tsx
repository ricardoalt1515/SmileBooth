            {/* Layout Configuration - AGREGAR DESPUÉS DE Voice Settings */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-foreground">Layout de Impresión</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Layout */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tipo de Layout</CardTitle>
                    <CardDescription>Disposición de las fotos en la tira</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.strip_layout}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, strip_layout: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vertical-3">3 fotos verticales</SelectItem>
                        <SelectItem value="vertical-4">4 fotos verticales</SelectItem>
                        <SelectItem value="vertical-6">6 fotos verticales</SelectItem>
                        <SelectItem value="grid-2x2">Grid 2x2</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Modo de Impresión */}
                <Card>
                  <CardHeader>
                    <CardTitle>Modo de Impresión</CardTitle>
                    <CardDescription>Simple o Dual (2 tiras lado a lado)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.print_mode}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, print_mode: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Simple (1 tira)</SelectItem>
                        <SelectItem value="dual-strip">Dual (2 tiras para cortar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>

              {/* Vista Previa */}
              <StripPreview
                layout={formData.strip_layout}
                printMode={formData.print_mode}
                designPreviewUrl={designs.find(d => d.is_active)?.preview_url}
                photosCount={formData.photos_to_take}
              />
            </div>
